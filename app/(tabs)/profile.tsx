import { useCallback, useRef, useState } from 'react';
import { ScrollView, View, StyleSheet, Switch, Pressable, Alert, Platform, Linking } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { ShareStreakCard } from '../../components/ShareStreakCard';
import { useTheme, spacing, radius } from '../../lib/theme';
import { Storage, streakFromCheckins, UserProfile, Prefs } from '../../lib/storage';
import { useAuth, signOut } from '../../lib/auth';
import { useScreenTracking, Analytics } from '../../lib/analytics';
import { useAiConsent } from '../../lib/consent';
import { PRIVACY_POLICY_URL, AI_PROVIDER_NAME } from '../../lib/legal';

export default function Profile() {
  useScreenTracking('profile');
  const { colors } = useTheme();
  const auth = useAuth();
  const [user, setUser] = useState<UserProfile>({});
  const [prefs, setPrefs] = useState<Prefs>({ hapticsOn: true, reminders: true });
  const [stats, setStats] = useState({ moods: 0, journals: 0, streak: 0 });
  const [sharing, setSharing] = useState(false);
  const cardRef = useRef<View>(null);
  const aiConsent = useAiConsent();

  const load = useCallback(async () => {
    const [u, p, m, j, c] = await Promise.all([
      Storage.getUser(),
      Storage.getPrefs(),
      Storage.listMood(),
      Storage.listJournal(),
      Storage.listCheckin(),
    ]);
    setUser(u);
    setPrefs(p);
    setStats({ moods: m.length, journals: j.length, streak: streakFromCheckins(c) });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function update(p: Prefs) {
    setPrefs(p);
    await Storage.setPrefs(p);
  }

  // Opt-in only: user taps "Share my streak". The exported image carries the
  // streak count and an encouraging line — never moods, journals, or AI/crisis data.
  async function shareStreak() {
    if (sharing) return;
    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'Sharing is not available on this device.');
        return;
      }
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      void Analytics.track('streak_shared', { streak: stats.streak });
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Coco streak',
        UTI: 'public.png',
      });
    } catch {
      Alert.alert('Could not share', 'Something went wrong creating your streak card. Please try again.');
    } finally {
      setSharing(false);
    }
  }

  function confirmClear() {
    if (Platform.OS === 'web') {
      if (window.confirm('Erase all of your local data? This cannot be undone.')) {
        Storage.clearAll().then(() => router.replace('/onboarding'));
      }
      return;
    }
    Alert.alert(
      'Erase your data?',
      'This deletes all your moods, journals, check-ins, and chat history from this device. It cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Erase', style: 'destructive', onPress: async () => { await Storage.clearAll(); router.replace('/onboarding'); } },
      ],
    );
  }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text variant="display">{user.name ? user.name : 'You'}</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          {auth.user && !auth.user.isAnonymous
            ? `Signed in as ${auth.user.email ?? auth.user.uid.slice(0, 10)}.`
            : 'Everything here lives on your device unless you say otherwise.'}
        </Text>

        {/* Account banner — high prominence so users know whether sync is on */}
        {auth.available ? (
          auth.user && !auth.user.isAnonymous ? (
            <View style={[styles.syncBanner, { backgroundColor: colors.primarySoft, borderColor: colors.primary, marginTop: spacing.lg }]}>
              <View style={[styles.syncIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="cloud-done" size={22} color={colors.primaryFg} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium" tone="primary" style={{ fontWeight: '700' }}>Synced to the cloud</Text>
                <Text variant="caption" tone="primary" style={{ opacity: 0.85, marginTop: 2 }}>
                  {auth.user.email ?? auth.user.uid.slice(0, 10)}
                </Text>
              </View>
              <Pressable onPress={() => signOut()} hitSlop={8} accessibilityLabel="Sign out" style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
                <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>Sign out</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => router.push('/auth/sign-in')}
              accessibilityRole="button"
              accessibilityLabel="Sign in to sync"
              style={({ pressed }) => [styles.syncBanner, { backgroundColor: colors.bgElevated, borderColor: colors.border, marginTop: spacing.lg, opacity: pressed ? 0.8 : 1 }]}
            >
              <View style={[styles.syncIcon, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="cloud-offline-outline" size={22} color={colors.textDim} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium" style={{ fontWeight: '700' }}>Local only — tap to sync</Text>
                <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>Email · Google · Apple. Keep your streak across devices.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </Pressable>
          )
        ) : (
          <View style={[styles.syncBanner, { backgroundColor: colors.surfaceMuted, borderColor: colors.border, marginTop: spacing.lg }]}>
            <View style={[styles.syncIcon, { backgroundColor: colors.surface }]}>
              <Ionicons name="cloud-offline" size={22} color={colors.textDim} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text variant="bodyMedium">Sync not configured</Text>
              <Text variant="caption" tone="dim">Add the Firebase web app id in app.json.</Text>
            </View>
          </View>
        )}

        <View style={[styles.statsRow, { marginTop: spacing.xl }]}>
          <Stat label="Day streak" value={stats.streak} colors={colors} />
          <Stat label="Mood logs" value={stats.moods} colors={colors} />
          <Stat label="Entries" value={stats.journals} colors={colors} />
        </View>

        {/* Gentle, opt-in share. Only the streak count leaves the device — no moods or journals. */}
        {stats.streak >= 1 && (
          <Pressable
            onPress={shareStreak}
            disabled={sharing}
            accessibilityRole="button"
            accessibilityLabel="Share my streak"
            accessibilityHint="Creates a calm image with your check-in streak that you can choose to share"
            style={({ pressed }) => [
              styles.shareRow,
              { backgroundColor: colors.surface, borderColor: colors.border, opacity: sharing ? 0.6 : pressed ? 0.8 : 1 },
            ]}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
            <Text variant="caption" tone="primary" style={{ marginLeft: spacing.sm, fontWeight: '700' }}>
              {sharing ? 'Preparing…' : 'Share my streak'}
            </Text>
          </Pressable>
        )}

        <Section title="My bookings">
          <Card onPress={() => router.push('/booking')} accessibilityLabel="View bookings">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="calendar-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Therapy bookings</Text>
                <Text variant="caption" tone="dim">View, reschedule, or cancel</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Your activity">
          <Card onPress={() => router.push('/activity')} accessibilityLabel="See your activity">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="bar-chart-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Time, sessions & habits</Text>
                <Text variant="caption" tone="dim">Where you spend time, what you use most</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Invite a friend">
          <Card onPress={() => router.push('/invite')} accessibilityLabel="Invite a friend to Coco">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="leaf-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Share Coco, gently</Text>
                <Text variant="caption" tone="dim">Pass it on to someone who might need a calmer moment</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Preferences">
          <Card style={{ padding: 0 }}>
            <Toggle
              label="Haptic feedback"
              value={!!prefs.hapticsOn}
              onChange={(v) => update({ ...prefs, hapticsOn: v })}
            />
            <Divider />
            <Toggle
              label="Daily reminder"
              value={!!prefs.reminders}
              onChange={(v) => update({ ...prefs, reminders: v })}
            />
            <Divider />
            <Toggle
              label="Reduce motion"
              value={!!prefs.reduceMotion}
              onChange={(v) => update({ ...prefs, reduceMotion: v })}
            />
          </Card>
        </Section>

        <Section title="Profile">
          <View style={{ gap: spacing.md }}>
            <Card onPress={() => router.push('/auth/profile-edit')} accessibilityLabel="Edit profile details">
              <Row label="Name, email, phone, gender" hint={user.name ?? 'Tap to add'} colors={colors} />
            </Card>
            <Card onPress={() => router.push('/onboarding')} accessibilityLabel="Edit goals">
              <Row label="Your goals" hint={(user.goals ?? []).slice(0, 2).join(' · ') || 'Not set'} colors={colors} />
            </Card>
          </View>
        </Section>

        <Section title="About">
          <Card onPress={() => router.push('/about')} accessibilityLabel="About Coco">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="ribbon-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Where Coco started</Text>
                <Text variant="caption" tone="dim">SIH 2022 · Green Ribbon Army · Credits</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Privacy">
          <Card>
            <Text variant="body">Your moods, journals, and check-ins stay on your device unless you sign in to sync them.</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 8, lineHeight: 19 }}>
              When you chat with Coco or use voice journaling, the messages you type (and your first name, if set) — or the audio you record — are sent to {AI_PROVIDER_NAME}, a third-party AI provider, to generate replies or transcribe your words. Audio is transcribed and then discarded.
            </Text>
          </Card>

          <Pressable
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
            style={({ pressed }) => [styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <Text variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.md }}>Privacy Policy</Text>
            <Ionicons name="open-outline" size={16} color={colors.textFaint} />
          </Pressable>

          {aiConsent.consented ? (
            <Pressable
              onPress={() => {
                Alert.alert(
                  'Turn off AI features?',
                  `Coco will stop sending anything to ${AI_PROVIDER_NAME}. You'll be asked to agree again next time you open chat or voice journaling.`,
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Turn off', style: 'destructive', onPress: () => aiConsent.revoke() },
                  ],
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Turn off AI features"
              style={({ pressed }) => [styles.linkRow, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.text} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">AI features are on</Text>
                <Text variant="caption" tone="dim">Tap to withdraw consent</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textFaint} />
            </Pressable>
          ) : (
            <Card tone="muted" style={{ marginTop: spacing.sm }}>
              <Text variant="caption" tone="dim">
                AI features are off. Coco will ask for your permission before sending anything when you first open chat or voice journaling.
              </Text>
            </Card>
          )}
        </Section>

        <Section title="Danger zone">
          <Pressable
            onPress={confirmClear}
            accessibilityRole="button"
            accessibilityLabel="Erase all data"
            style={({ pressed }) => [
              styles.danger,
              { borderColor: colors.danger, backgroundColor: colors.dangerSoft, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text variant="bodyMedium" tone="danger" style={{ marginLeft: 8 }}>Erase all my data</Text>
          </Pressable>
        </Section>
      </ScrollView>

      {/* Off-screen render target for the shareable streak card. Never visible to the user. */}
      <View pointerEvents="none" style={styles.offscreen} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <ShareStreakCard ref={cardRef} streak={stats.streak} name={user.name} />
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value, colors }: { label: string; value: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text variant="title">{value}</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="micro" tone="dim" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>{title}</Text>
      {children}
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (b: boolean) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.toggle}>
      <Text variant="bodyMedium">{label}</Text>
      <Switch value={value} onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={'#fff'}
      />
    </View>
  );
}

function Row({ label, hint, colors }: { label: string; hint: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ flex: 1 }}>
        <Text variant="bodyMedium">{label}</Text>
        <Text variant="caption" tone="dim">{hint}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />;
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: spacing.md },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: 0,
    opacity: 0,
  },
  stat: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  danger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  iconRound: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  syncIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
