import { useCallback, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useScreenTracking } from '../../lib/analytics';
import { tap } from '../../lib/haptics';
import {
  DEFAULT_SETTINGS,
  NotificationSettings,
  getNotificationSettings,
  setNotificationSettings,
  requestNotificationPermission,
  hasNotificationPermission,
  registerPushToken,
  syncDailyReminder,
  isWithinQuietHours,
} from '../../lib/notifications';

function fmt(hour: number, minute = 0): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:${String(minute).padStart(2, '0')} ${ampm}`;
}

/**
 * Gentle, opt-in notification settings.
 * - Reminders are OFF until the user turns them on; only then do we ask the OS
 *   for permission.
 * - A single calm daily check-in at a time they choose.
 * - Quiet hours guarantee nothing ever lands overnight.
 * Nothing here ever carries mood/journal/crisis content.
 */
export default function NotificationSettingsScreen() {
  useScreenTracking('notification_settings');
  const { colors } = useTheme();
  const [s, setS] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [granted, setGranted] = useState(true);
  const [status, setStatus] = useState<Awaited<ReturnType<typeof syncDailyReminder>>>('off');

  const load = useCallback(() => {
    let active = true;
    (async () => {
      const [loaded, perm] = await Promise.all([
        getNotificationSettings(),
        hasNotificationPermission(),
      ]);
      if (!active) return;
      setS(loaded);
      setGranted(perm);
    })();
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(load);

  // Persist + reconcile the schedule on every change.
  const apply = useCallback(async (next: NotificationSettings) => {
    setS(next);
    await setNotificationSettings(next);
    const st = await syncDailyReminder();
    setStatus(st);
  }, []);

  async function onToggleEnabled(value: boolean) {
    if (!value) {
      await apply({ ...s, enabled: false });
      return;
    }
    // Turning ON: this is the one moment we ask the OS for permission.
    const ok = await requestNotificationPermission();
    setGranted(ok);
    if (!ok) {
      Alert.alert(
        'Notifications are off in Settings',
        'To get a gentle daily check-in, allow notifications for Coco in your device Settings. You can turn them off again anytime.',
      );
      // Keep the preference as "wanted on" so it activates once they grant it.
      await apply({ ...s, enabled: true });
      return;
    }
    void registerPushToken();
    await apply({ ...s, enabled: true });
  }

  const stepHour = (current: number, delta: number) => (current + delta + 24) % 24;
  const stepMinute = (current: number, delta: number) => (current + delta + 60) % 60;

  const quietConflict = s.enabled && granted && isWithinQuietHours(s.reminderHour, s);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Reminders</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.md }}>
        <Text variant="body" tone="dim" style={{ marginBottom: spacing.xs }}>
          A single, gentle nudge — only if you’d like one. No streaks, no pressure. You’re in control, and you can turn this off anytime.
        </Text>

        {/* Master opt-in */}
        <Card style={{ padding: 0 }}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text variant="bodyMedium">Daily check-in reminder</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>
                A soft invitation to pause and breathe
              </Text>
            </View>
            <Switch
              value={s.enabled}
              onValueChange={onToggleEnabled}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        {s.enabled && !granted && (
          <Card tone="muted">
            <Text variant="caption" tone="dim">
              Notifications are currently blocked for Coco in your device Settings. Allow them there to start receiving your gentle reminder.
            </Text>
          </Card>
        )}

        {s.enabled && (
          <>
            {/* Reminder time */}
            <Text variant="micro" tone="dim" style={styles.sectionLabel}>WHAT TIME?</Text>
            <Card>
              <View style={styles.timeRow}>
                <Stepper
                  label="Hour"
                  value={fmt(s.reminderHour, 0).split(':')[0] + (s.reminderHour < 12 ? ' AM' : ' PM')}
                  onMinus={() => apply({ ...s, reminderHour: stepHour(s.reminderHour, -1) })}
                  onPlus={() => apply({ ...s, reminderHour: stepHour(s.reminderHour, 1) })}
                  colors={colors}
                />
                <Stepper
                  label="Minute"
                  value={`:${String(s.reminderMinute).padStart(2, '0')}`}
                  onMinus={() => apply({ ...s, reminderMinute: stepMinute(s.reminderMinute, -5) })}
                  onPlus={() => apply({ ...s, reminderMinute: stepMinute(s.reminderMinute, 5) })}
                  colors={colors}
                />
              </View>
              <Text variant="caption" tone="primary" align="center" style={{ marginTop: spacing.sm, fontWeight: '700' }}>
                {fmt(s.reminderHour, s.reminderMinute)}
              </Text>
            </Card>

            {quietConflict && (
              <Card tone="muted">
                <Text variant="caption" tone="dim">
                  That time is inside your quiet hours, so no reminder is scheduled. Pick a time outside your quiet window, or adjust quiet hours below.
                </Text>
              </Card>
            )}

            {/* Quiet hours */}
            <Text variant="micro" tone="dim" style={styles.sectionLabel}>QUIET HOURS</Text>
            <Card style={{ padding: 0 }}>
              <View style={styles.row}>
                <View style={{ flex: 1, paddingRight: spacing.md }}>
                  <Text variant="bodyMedium">Never disturb overnight</Text>
                  <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>
                    Reminders stay silent during these hours
                  </Text>
                </View>
                <Switch
                  value={s.quietHoursEnabled}
                  onValueChange={(v) => apply({ ...s, quietHoursEnabled: v })}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor="#fff"
                />
              </View>
              {s.quietHoursEnabled && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={[styles.timeRow, { padding: spacing.lg, paddingTop: spacing.md }]}>
                    <Stepper
                      label="From"
                      value={fmt(s.quietStartHour, 0)}
                      onMinus={() => apply({ ...s, quietStartHour: stepHour(s.quietStartHour, -1) })}
                      onPlus={() => apply({ ...s, quietStartHour: stepHour(s.quietStartHour, 1) })}
                      colors={colors}
                    />
                    <Stepper
                      label="Until"
                      value={fmt(s.quietEndHour, 0)}
                      onMinus={() => apply({ ...s, quietEndHour: stepHour(s.quietEndHour, -1) })}
                      onPlus={() => apply({ ...s, quietEndHour: stepHour(s.quietEndHour, 1) })}
                      colors={colors}
                    />
                  </View>
                </>
              )}
            </Card>

            {status === 'scheduled' && !quietConflict && (
              <Text variant="caption" tone="dim" align="center" style={{ marginTop: spacing.xs }}>
                Your reminder is set for {fmt(s.reminderHour, s.reminderMinute)} each day.
              </Text>
            )}
          </>
        )}

        <Card tone="muted" style={{ marginTop: spacing.md }}>
          <Text variant="caption" tone="dim" style={{ lineHeight: 19 }}>
            Reminders only ever say a kind, general hello — never anything about your moods, journals, or conversations. Coco will never send a reminder during a difficult moment.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  colors,
}: {
  label: string;
  value: string;
  onMinus: () => void;
  onPlus: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text variant="micro" tone="dim" style={{ marginBottom: spacing.xs }}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable
          onPress={() => { tap('tap'); onMinus(); }}
          accessibilityRole="button"
          accessibilityLabel={`${label} earlier`}
          hitSlop={8}
          style={({ pressed }) => [styles.stepBtn, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="remove" size={18} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium" style={{ minWidth: 64, textAlign: 'center' }}>{value}</Text>
        <Pressable
          onPress={() => { tap('tap'); onPlus(); }}
          accessibilityRole="button"
          accessibilityLabel={`${label} later`}
          hitSlop={8}
          style={({ pressed }) => [styles.stepBtn, { backgroundColor: colors.surfaceMuted, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="add" size={18} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionLabel: { textTransform: 'uppercase', marginTop: spacing.md, marginBottom: spacing.xs },
  timeRow: { flexDirection: 'row', gap: spacing.md },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.lg },
});
