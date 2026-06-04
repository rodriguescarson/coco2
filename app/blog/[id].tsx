import { ScrollView, View, StyleSheet, Pressable, Linking } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { MedicalDisclaimer } from '../../components/MedicalDisclaimer';
import { useTheme, spacing } from '../../lib/theme';
import { useScreenTracking } from '../../lib/analytics';
import { getArticle } from '../../lib/articles';

export default function ArticleDetail() {
  useScreenTracking('blog-article');
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = getArticle(id);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Article</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        {!article ? (
          <View style={{ paddingTop: spacing.xxl, alignItems: 'center' }}>
            <Text variant="title">Not found</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 6, textAlign: 'center' }}>
              This article isn&apos;t available. Head back to the list.
            </Text>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Pill label={article.topic} />
              <Text variant="micro" tone="dim">{article.read} read</Text>
            </View>
            <Text variant="display" style={{ marginTop: spacing.sm }}>{article.title}</Text>

            <View style={{ marginTop: spacing.lg, gap: spacing.md }}>
              {article.body.map((para, i) => (
                <Text key={i} variant="body" style={{ lineHeight: 24 }}>{para}</Text>
              ))}
            </View>

            <View style={{ marginTop: spacing.xl }}>
              <Text variant="micro" tone="dim" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>Sources</Text>
              <Card style={{ padding: 0 }}>
                {article.sources.map((s, i) => (
                  <View key={s.url}>
                    <Pressable
                      onPress={() => Linking.openURL(s.url).catch(() => {})}
                      accessibilityRole="link"
                      accessibilityLabel={`Open source: ${s.label}`}
                      style={({ pressed }) => [styles.sourceRow, { opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Ionicons name="link-outline" size={16} color={colors.primary} style={{ marginTop: 2 }} />
                      <Text variant="caption" style={{ flex: 1, marginLeft: 10, color: colors.text }}>{s.label}</Text>
                      <Ionicons name="open-outline" size={14} color={colors.textFaint} />
                    </Pressable>
                    {i < article.sources.length - 1 ? (
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />
                    ) : null}
                  </View>
                ))}
              </Card>
            </View>

            <MedicalDisclaimer />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  sourceRow: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg },
});
