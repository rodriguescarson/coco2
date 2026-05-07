import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing, radius } from '../../lib/theme';
import { DataWrite } from '../../lib/data-write';
import { useScreenTracking, Analytics } from '../../lib/analytics';
import { journalPrompts } from '../../lib/data';
import { tap } from '../../lib/haptics';

export default function NewEntry() {
  useScreenTracking('journal/new');
  const { colors } = useTheme();
  const { prompt: promptParam } = useLocalSearchParams<{ prompt?: string }>();
  const [prompt, setPrompt] = useState<string>(promptParam || journalPrompts[Math.floor(Math.random() * journalPrompts.length)]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (promptParam) setPrompt(promptParam);
  }, [promptParam]);

  async function save() {
    if (!body.trim()) return;
    await DataWrite.addJournal({
      id: `${Date.now()}`,
      title: title.trim() || undefined,
      prompt,
      body: body.trim(),
      at: Date.now(),
    });
    void Analytics.track('journal_created', { hasTitle: !!title.trim(), hasPrompt: !!prompt, bodyLength: body.trim().length });
    tap('success');
    router.back();
  }

  function shuffle() {
    setPrompt(journalPrompts[Math.floor(Math.random() * journalPrompts.length)]);
    tap('select');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Cancel" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">New entry</Text>
        <Pressable onPress={save} accessibilityLabel="Save" hitSlop={12} disabled={!body.trim()}>
          <Text variant="bodyMedium" style={{ color: body.trim() ? colors.primary : colors.textFaint, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.promptBox, { backgroundColor: colors.primarySoft }]}>
          <View style={{ flex: 1 }}>
            <Text variant="micro" tone="primary">PROMPT</Text>
            <Text variant="bodyMedium" tone="primary" style={{ marginTop: 4 }}>{prompt}</Text>
          </View>
          <Pressable onPress={shuffle} accessibilityLabel="New prompt" hitSlop={8}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title (optional)"
          placeholderTextColor={colors.textFaint}
          style={[styles.title, { color: colors.text }]}
          accessibilityLabel="Title"
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Start anywhere..."
          placeholderTextColor={colors.textFaint}
          style={[styles.body, { color: colors.text }]}
          multiline
          autoFocus
          accessibilityLabel="Journal body"
          textAlignVertical="top"
        />
        <Button label="Save entry" icon="checkmark" fullWidth size="lg" disabled={!body.trim()} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  promptBox: { padding: spacing.lg, borderRadius: radius.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginTop: spacing.lg },
  body: { fontSize: 17, lineHeight: 24, marginTop: spacing.md, minHeight: 240, marginBottom: spacing.lg },
});
