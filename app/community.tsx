import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing } from '../lib/theme';
import { useScreenTracking } from '../lib/analytics';

const circles = [
  { id: 'c1', name: 'Late-night anxiety', members: 412, topic: 'Anxiety', live: true },
  { id: 'c2', name: 'Grief, slowly', members: 207, topic: 'Grief', live: false },
  { id: 'c3', name: 'Burnout in tech', members: 1830, topic: 'Burnout', live: true },
  { id: 'c4', name: 'New parents, new feelings', members: 538, topic: 'Family', live: false },
  { id: 'c5', name: 'Sober, curious', members: 924, topic: 'Recovery', live: true },
  { id: 'c6', name: 'Quiet, queer, here', members: 612, topic: 'Identity', live: false },
];

export default function Community() {
  useScreenTracking('community');
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Community</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Circles.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Anonymous. Moderated. You set the pace.</Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {circles.map((c) => (
            <Card key={c.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pill label={c.topic} />
                {c.live ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={[styles.pulse, { backgroundColor: colors.primary }]} />
                    <Text variant="micro" tone="primary">live now</Text>
                  </View>
                ) : null}
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>{c.name}</Text>
              <Text variant="caption" tone="dim">{c.members.toLocaleString()} members</Text>
            </Card>
          ))}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            Live posting opens once you complete onboarding and the community guidelines walkthrough. We moderate against advice, comparison, and crisis dismissal.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  pulse: { width: 8, height: 8, borderRadius: 4 },
});
