import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useTheme, spacing } from '../../lib/theme';
import { Storage, JournalEntry } from '../../lib/storage';

export default function JournalDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);

  useEffect(() => {
    Storage.listJournal().then((all) => setEntry(all.find((j) => j.id === id) ?? null));
  }, [id]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Entry</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {entry ? (
          <>
            <Text variant="micro" tone="dim">{new Date(entry.at).toLocaleString()}</Text>
            {entry.title ? <Text variant="title" style={{ marginTop: 4 }}>{entry.title}</Text> : null}
            {entry.prompt ? <Text variant="caption" tone="primary" style={{ marginTop: 8 }}>Prompt: {entry.prompt}</Text> : null}
            <Text variant="body" style={{ marginTop: spacing.lg, lineHeight: 26 }}>{entry.body}</Text>
          </>
        ) : (
          <Text tone="dim">Entry not found.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
