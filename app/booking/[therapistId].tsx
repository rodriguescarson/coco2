import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing, radius } from '../../lib/theme';
import { therapists } from '../../lib/data';
import type { Booking } from '../../lib/storage';
import { DataWrite } from '../../lib/data-write';
import { tap } from '../../lib/haptics';

const SLOT_HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18];

function nextDays(count: number): Date[] {
  const out: Date[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

function slotKey(d: Date, hour: number): number {
  const x = new Date(d);
  x.setHours(hour, 0, 0, 0);
  return x.getTime();
}

export default function Booking() {
  const { colors } = useTheme();
  const { therapistId } = useLocalSearchParams<{ therapistId: string }>();
  const therapist = useMemo(() => therapists.find((t) => t.id === therapistId), [therapistId]);

  const [day, setDay] = useState(0);
  const [hour, setHour] = useState<number | null>(null);
  const [modality, setModality] = useState<'video' | 'in-person'>(therapist?.modality === 'in-person' ? 'in-person' : 'video');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  if (!therapist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Text variant="title">Therapist not found.</Text>
        <Button label="Go back" style={{ marginTop: spacing.lg }} onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  const days = nextDays(14);
  const selectedDate = days[day];

  async function confirm() {
    if (hour == null || !therapist) return;
    setBusy(true);
    const startsAt = slotKey(selectedDate, hour);
    const booking: Booking = {
      id: `${Date.now()}-${therapist.id}`,
      therapistId: therapist.id,
      therapistName: therapist.name,
      startsAt,
      modality: modality === 'video' ? 'video' : 'in-person',
      notes: notes.trim() || undefined,
      status: 'confirmed',
      createdAt: Date.now(),
    };
    await DataWrite.addBooking(booking);
    tap('success');
    setBusy(false);
    if (Platform.OS === 'web') {
      window.alert('Booked. You will see it in Profile → My bookings.');
    } else {
      Alert.alert('Booked', `You're set with ${therapist.name} on ${selectedDate.toDateString()} at ${formatHour(hour)}.`);
    }
    router.replace('/booking');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Cancel" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Book a session</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        {/* Therapist summary */}
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
              <Text variant="bodyMedium" tone="primary" style={{ fontWeight: '700' }}>
                {therapist.name.split(' ').slice(-1)[0]?.[0] ?? 'T'}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text variant="bodyMedium">{therapist.name}</Text>
              <Text variant="caption" tone="dim">{therapist.credentials} · {therapist.city}</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{therapist.rate}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
            {therapist.specialties.map((s) => (
              <Pill key={s} label={s} />
            ))}
          </View>
        </Card>

        {/* Modality */}
        <Section title="Session type">
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {therapist.modality !== 'in-person' && (
              <ModeOption icon="videocam-outline" label="Video" selected={modality === 'video'} onPress={() => setModality('video')} colors={colors} />
            )}
            {therapist.modality !== 'video' && (
              <ModeOption icon="storefront-outline" label="In person" selected={modality === 'in-person'} onPress={() => setModality('in-person')} colors={colors} />
            )}
          </View>
        </Section>

        {/* Date picker */}
        <Section title="Choose a day">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingVertical: 4 }}>
            {days.map((d, i) => {
              const sel = i === day;
              return (
                <Pressable
                  key={d.toISOString()}
                  onPress={() => { setDay(i); setHour(null); tap('select'); }}
                  accessibilityRole="button"
                  accessibilityLabel={d.toDateString()}
                  accessibilityState={{ selected: sel }}
                  style={({ pressed }) => [
                    styles.dayChip,
                    {
                      backgroundColor: sel ? colors.primary : colors.surface,
                      borderColor: sel ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text variant="micro" style={{ color: sel ? colors.primaryFg : colors.textDim }}>
                    {d.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()}
                  </Text>
                  <Text variant="title" style={{ color: sel ? colors.primaryFg : colors.text, marginTop: 4 }}>
                    {d.getDate()}
                  </Text>
                  <Text variant="micro" style={{ color: sel ? colors.primaryFg : colors.textDim, marginTop: 2 }}>
                    {d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Section>

        {/* Time picker */}
        <Section title="Choose a time">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {SLOT_HOURS.map((h) => {
              const sel = h === hour;
              return (
                <Pressable
                  key={h}
                  onPress={() => { setHour(h); tap('select'); }}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatHour(h)}`}
                  accessibilityState={{ selected: sel }}
                  style={({ pressed }) => [
                    styles.timeChip,
                    {
                      backgroundColor: sel ? colors.primary : colors.surface,
                      borderColor: sel ? colors.primary : colors.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text variant="caption" style={{ color: sel ? colors.primaryFg : colors.text, fontWeight: '600' }}>
                    {formatHour(h)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Notes */}
        <Section title="Anything you want them to know">
          <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Optional. A few words is plenty."
              placeholderTextColor={colors.textFaint}
              style={{ color: colors.text, fontSize: 16, minHeight: 80 }}
              multiline
              accessibilityLabel="Booking notes"
            />
          </View>
        </Section>

        <Card tone="muted" style={{ marginTop: spacing.lg }}>
          <Text variant="caption" tone="dim">
            This is a held slot — your therapist will confirm by email within 24 hours. You can cancel from Profile → My bookings without penalty up to 12 hours before the session.
          </Text>
        </Card>

        <Button
          label={hour == null ? 'Pick a time' : `Confirm ${selectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at ${formatHour(hour)}`}
          icon="checkmark"
          fullWidth
          size="lg"
          disabled={hour == null}
          loading={busy}
          style={{ marginTop: spacing.xl }}
          onPress={confirm}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeOption({ icon, label, selected, onPress, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.modeOption,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={selected ? colors.primary : colors.text} />
      <Text variant="bodyMedium" style={{ marginLeft: 8, color: selected ? colors.primary : colors.text }}>
        {label}
      </Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="micro" tone="dim" style={{ marginBottom: spacing.md, textTransform: 'uppercase' }}>{title}</Text>
      {children}
    </View>
  );
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM';
  if (h < 12) return `${h} AM`;
  if (h === 12) return '12 PM';
  return `${h - 12} PM`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  modeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayChip: {
    width: 64,
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  timeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 72,
    alignItems: 'center',
  },
  input: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
});

