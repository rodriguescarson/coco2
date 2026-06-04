// Full-screen consent gate shown before any data is sent to the third-party AI
// provider. Used by the Coco chat and voice journaling screens. Nothing is
// transmitted until the user taps "I agree".

import { ScrollView, View, StyleSheet, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './ui/Text';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { useTheme, spacing } from '../lib/theme';
import { AI_DATA_DISCLOSURE } from '../lib/consent';
import { AI_PROVIDER_NAME, AI_PROVIDER_URL, PRIVACY_POLICY_URL } from '../lib/legal';

export function AiConsentGate({
  onAccept,
  onDecline,
  feature = 'Coco',
}: {
  onAccept: () => void;
  onDecline: () => void;
  feature?: string;
}) {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={onDecline} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="micro" tone="dim">BEFORE YOU START</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="sparkles-outline" size={26} color={colors.primary} />
        </View>
        <Text variant="display" style={{ marginTop: spacing.lg }}>{feature} uses an AI service.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: spacing.sm, lineHeight: 22 }}>
          To reply to you, Coco sends what you write to a third-party AI provider. Here&apos;s exactly what that means before you decide.
        </Text>

        <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
          {AI_DATA_DISCLOSURE.map((item) => (
            <Card key={item.title} tone="muted">
              <Text variant="bodyMedium">{item.title}</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 4, lineHeight: 20 }}>{item.detail}</Text>
            </Card>
          ))}
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg }}>
          <Pressable
            onPress={() => Linking.openURL(AI_PROVIDER_URL).catch(() => {})}
            accessibilityRole="link"
            style={({ pressed }) => [styles.link, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="open-outline" size={14} color={colors.text} />
            <Text variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>About {AI_PROVIDER_NAME}</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})}
            accessibilityRole="link"
            style={({ pressed }) => [styles.link, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.text} />
            <Text variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>Privacy Policy</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          <Button label="I agree — start" fullWidth size="lg" onPress={onAccept} />
          <Button label="Not now" variant="ghost" fullWidth onPress={onDecline} />
        </View>

        <Text variant="micro" tone="faint" style={{ marginTop: spacing.lg, textAlign: 'center', lineHeight: 18 }}>
          You can withdraw consent anytime in You → Privacy. Coco is not a medical service and not a substitute for professional care.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
