import { useCallback, useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing, radius } from '../lib/theme';
import { Storage, MoodEntry, todayKey } from '../lib/storage';
import { DataWrite } from '../lib/data-write';
import { moodLabels } from '../lib/data';
import { tap } from '../lib/haptics';

const TAGS = ['Work', 'Sleep', 'Family', 'Money', 'Friends', 'Body', 'Loneliness', 'Hopeful', 'Tired', 'Anxious', 'Calm', 'Angry'];

export default function Mood() {
  const { colors } = useTheme();
  const [score, setScore] = useState<MoodEntry['score']>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [list, setList] = useState<MoodEntry[]>([]);

  const load = useCallback(async () => setList(await Storage.listMood()), []);
  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    const entry: MoodEntry = { id: `${Date.now()}`, score, tags, note: note.trim() || undefined, at: Date.now() };
    await DataWrite.addMood(entry);
    tap('success');
    setScore(3);
    setTags([]);
    setNote('');
    load();
  }

  function toggle(t: string) { setTags((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t]); }

  const last7 = list.slice(0, 7).reverse();
  const todays = list.filter((m) => todayKey(new Date(m.at)) === todayKey()).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Mood</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">How do you feel?</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>{todays === 0 ? 'No log today yet.' : `${todays} log${todays > 1 ? 's' : ''} today.`}</Text>

        <View style={[styles.faces, { marginTop: spacing.xl }]}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable
              key={s}
              onPress={() => { setScore(s as MoodEntry['score']); tap('select'); }}
              accessibilityRole="button"
              accessibilityLabel={`${moodLabels[s - 1]} mood`}
              accessibilityState={{ selected: score === s }}
              style={({ pressed }) => [
                styles.face,
                {
                  backgroundColor: colors.surface,
                  borderColor: score === s ? colors.moodColors[s - 1] : colors.border,
                  borderWidth: score === s ? 2 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 28 }}>{['😣', '😕', '😐', '🙂', '😊'][s - 1]}</Text>
              <Text variant="micro" tone="dim" style={{ marginTop: 4 }}>{moodLabels[s - 1]}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>What's tied to it?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md }}>
          {TAGS.map((t) => (
            <Pill key={t} label={t} selected={tags.includes(t)} onPress={() => toggle(t)} />
          ))}
        </View>

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>Anything else?</Text>
        <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.sm }]}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional. A few words for future you."
            placeholderTextColor={colors.textFaint}
            style={{ color: colors.text, fontSize: 16, minHeight: 80 }}
            multiline
            accessibilityLabel="Mood note"
          />
        </View>

        <Button label="Save mood" icon="checkmark" fullWidth size="lg" style={{ marginTop: spacing.xl }} onPress={save} />

        {last7.length > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="subtitle">Your last week</Text>
            <Card style={{ marginTop: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100 }}>
                {last7.map((m) => (
                  <View
                    key={m.id}
                    style={{
                      flex: 1,
                      height: `${(m.score / 5) * 100}%`,
                      backgroundColor: colors.moodColors[m.score - 1],
                      borderRadius: 4,
                    }}
                    accessibilityLabel={`${moodLabels[m.score - 1]} on ${new Date(m.at).toLocaleDateString()}`}
                  />
                ))}
              </View>
              <Text variant="caption" tone="dim" style={{ marginTop: spacing.sm }}>
                {last7.length} of last {Math.min(7, list.length)} entries
              </Text>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  faces: { flexDirection: 'row', gap: spacing.sm },
  face: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  input: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
});
