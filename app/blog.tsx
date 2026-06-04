import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { MedicalDisclaimer } from '../components/MedicalDisclaimer';
import { useTheme, spacing } from '../lib/theme';
import { useScreenTracking } from '../lib/analytics';
import { articles } from '../lib/articles';

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
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Short pieces, no fluff. Each one cites its sources.</Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {articles.map((a) => (
            <Card
              key={a.id}
              onPress={() => router.push(`/blog/${a.id}`)}
              accessibilityLabel={`${a.title}. ${a.read} read.`}
              accessibilityHint="Opens the full article"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pill label={a.topic} />
                <Text variant="micro" tone="dim">{a.read} read</Text>
                <View style={{ flex: 1 }} />
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>{a.title}</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>{a.summary}</Text>
            </Card>
          ))}
        </View>

        <MedicalDisclaimer />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
