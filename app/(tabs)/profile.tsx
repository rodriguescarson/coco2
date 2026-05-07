import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, Switch, Pressable, Alert, Platform } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { useTheme, spacing, radius } from '../../lib/theme';
import { Storage, streakFromCheckins, UserProfile, Prefs } from '../../lib/storage';

export default function Profile() {
  const { colors } = useTheme();
  const [user, setUser] = useState<UserProfile>({});
  const [prefs, setPrefs] = useState<Prefs>({ hapticsOn: true, reminders: true });
  const [stats, setStats] = useState({ moods: 0, journals: 0, streak: 0 });

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
          Everything here lives on your device unless you say otherwise.
        </Text>

        <View style={[styles.statsRow, { marginTop: spacing.xl }]}>
          <Stat label="Day streak" value={stats.streak} colors={colors} />
          <Stat label="Mood logs" value={stats.moods} colors={colors} />
          <Stat label="Entries" value={stats.journals} colors={colors} />
        </View>

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
          <Card onPress={() => router.push('/onboarding')} accessibilityLabel="Edit profile">
            <Row label="Name & goals" hint={user.name ?? 'Not set'} colors={colors} />
          </Card>
        </Section>

        <Section title="Privacy">
          <Card>
            <Text variant="body">Your data is local. Coco doesn't sync your moods, journals, or chat without your explicit setup.</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 6 }}>
              The chatbot sends only the message you type to a privacy-respecting LLM provider. No identifiers are sent.
            </Text>
          </Card>
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
});
