import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing } from '../../lib/theme';
import { Storage, JournalEntry } from '../../lib/storage';

export default function JournalList() {
  const { colors } = useTheme();
  const [items, setItems] = useState<JournalEntry[]>([]);

  const load = useCallback(async () => setItems(await Storage.listJournal()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Journal</Text>
        <Pressable onPress={() => router.push('/journal/new')} accessibilityLabel="New entry" hitSlop={12}>
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Your words.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Private. Local. Yours.</Text>

        {items.length === 0 ? (
          <Card style={{ marginTop: spacing.xl }} tone="muted">
            <Text variant="body">No entries yet. Start with a small one.</Text>
            <Button label="Write your first entry" icon="create-outline" style={{ marginTop: spacing.md }} onPress={() => router.push('/journal/new')} />
          </Card>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            {items.map((j) => (
              <Card key={j.id}>
                <Text variant="micro" tone="dim">{new Date(j.at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
                {j.title ? <Text variant="bodyMedium" style={{ marginTop: 4 }}>{j.title}</Text> : null}
                {j.prompt ? <Text variant="caption" tone="primary" style={{ marginTop: 4 }}>{j.prompt}</Text> : null}
                <Text variant="body" style={{ marginTop: 8 }} numberOfLines={4}>{j.body}</Text>
                <Pressable
                  onPress={async () => {
                    await Storage.deleteJournal(j.id);
                    load();
                  }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Delete entry"
                  style={{ alignSelf: 'flex-end', marginTop: 8 }}
                >
                  <Text variant="caption" tone="dim">Delete</Text>
                </Pressable>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
