import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing } from '../../lib/theme';
import { useScreenTracking } from '../../lib/analytics';
import { circleCatalog } from '../../lib/data';
import { isModerator } from '../../lib/community';

export default function Community() {
  useScreenTracking('community');
  const { colors } = useTheme();
  const moderator = isModerator();
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
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          Anonymous. Moderated. You set the pace.
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {circleCatalog.map((c) => (
            <Card key={c.id} onPress={() => router.push(`/community/${c.id}`)} accessibilityLabel={`Open ${c.name} circle`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pill label={c.topic} />
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>{c.name}</Text>
              <Text variant="caption" tone="dim">{c.description}</Text>
            </Card>
          ))}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            Circles are for sharing and being heard — not advice, comparison, or crisis response. They aren’t monitored in real time. If you’re in danger, tap SOS for hotlines that answer now.
          </Text>
        </Card>

        {moderator ? (
          <Pressable
            onPress={() => router.push('/community/moderate')}
            accessibilityLabel="Open moderation queue"
            style={{ marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textFaint} />
            <Text variant="caption" tone="dim">Moderation queue</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
