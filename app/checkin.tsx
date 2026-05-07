import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { Storage, todayKey, streakFromCheckins, CheckinEntry } from '../lib/storage';
import { DataWrite } from '../lib/data-write';
import { useScreenTracking, Analytics } from '../lib/analytics';
import { dailyPrompts } from '../lib/data';
import { tap } from '../lib/haptics';

export default function CheckIn() {
  useScreenTracking('checkin');
  const { colors } = useTheme();
  const [feeling, setFeeling] = useState('');
  const [gratitude, setGratitude] = useState('');
  const [streak, setStreak] = useState(0);
  const [existing, setExisting] = useState<CheckinEntry | null>(null);

  const dayIndex = new Date().getDate() % dailyPrompts.length;
  const prompt = dailyPrompts[dayIndex];

  useEffect(() => {
    Storage.listCheckin().then((c) => {
      setStreak(streakFromCheckins(c));
      const e = c.find((x) => x.date === todayKey());
      if (e) {
        setExisting(e);
        setFeeling(e.prompts.feeling);
        setGratitude(e.prompts.gratitude || '');
      }
    });
  }, []);

  async function save() {
    if (!feeling.trim()) return;
    await DataWrite.addCheckin({
      date: todayKey(),
      at: Date.now(),
      prompts: { feeling: feeling.trim(), gratitude: gratitude.trim() || undefined },
    });
    void Analytics.track('checkin_completed', { hasGratitude: !!gratitude.trim(), streak });
    tap('success');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Cancel" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Daily check-in</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.streakBox, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="flame" size={20} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text variant="bodyMedium" tone="primary">{streak}-day streak</Text>
            <Text variant="caption" tone="primary" style={{ opacity: 0.85 }}>
              {existing ? 'Already checked in today. Edit if you want.' : 'Showing up matters more than the answer.'}
            </Text>
          </View>
        </View>

        <Text variant="display" style={{ marginTop: spacing.xl }}>{prompt.feeling}</Text>
        <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
          <TextInput
            value={feeling}
            onChangeText={setFeeling}
            placeholder="A sentence is enough."
            placeholderTextColor={colors.textFaint}
            style={{ color: colors.text, fontSize: 16, minHeight: 80 }}
            multiline
            accessibilityLabel="Feeling answer"
            autoFocus
          />
        </View>

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>{prompt.reflection}</Text>
        <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
          <TextInput
            value={gratitude}
            onChangeText={setGratitude}
            placeholder="Optional"
            placeholderTextColor={colors.textFaint}
            style={{ color: colors.text, fontSize: 16, minHeight: 60 }}
            multiline
            accessibilityLabel="Gratitude answer"
          />
        </View>

        <Button label={existing ? 'Update check-in' : 'Save check-in'} icon="checkmark" fullWidth size="lg" disabled={!feeling.trim()} style={{ marginTop: spacing.xl }} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  streakBox: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg },
  input: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
});
