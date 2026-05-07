import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing } from '../lib/theme';
import { useScreenTracking } from '../lib/analytics';

const articles = [
  { id: 'a1', title: 'Why does anxiety lie to you?', topic: 'Anxiety', read: '4 min', body: 'A primer on cognitive distortions and the simple practice of naming them out loud.' },
  { id: 'a2', title: 'The physiological sigh, in 60 seconds', topic: 'Breathing', read: '2 min', body: 'A Stanford-popularized exhale that resets your nervous system faster than anything else.' },
  { id: 'a3', title: 'Sleep hygiene without the lectures', topic: 'Sleep', read: '5 min', body: 'Three things that actually move the needle on sleep, ranked by effort.' },
  { id: 'a4', title: 'Talking to a friend in crisis', topic: 'Crisis', read: '6 min', body: 'What to say, what to skip, when to take it seriously.' },
  { id: 'a5', title: 'Journaling without "Dear diary"', topic: 'Journaling', read: '3 min', body: 'Prompts that make journaling work even if you have always hated it.' },
];

export default function Blog() {
  useScreenTracking('blog');
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Articles</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Read.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Short pieces, no fluff.</Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {articles.map((a) => (
            <Card key={a.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pill label={a.topic} />
                <Text variant="micro" tone="dim">{a.read} read</Text>
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>{a.title}</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>{a.body}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
