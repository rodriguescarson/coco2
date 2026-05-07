import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { useTheme, spacing, radius } from '../../lib/theme';

const tools: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; href: string; tint?: 'primary' | 'accent' | 'info' | 'warning' | 'danger' }[] = [
  { icon: 'cloud-outline', title: 'Breathing exercises', subtitle: 'Box, 4-7-8, sigh, coherent', href: '/breathe', tint: 'primary' },
  { icon: 'pulse-outline', title: 'Mood tracker', subtitle: 'Log how you feel', href: '/mood', tint: 'accent' },
  { icon: 'create-outline', title: 'Journal', subtitle: 'Write it out', href: '/journal', tint: 'primary' },
  { icon: 'flower-outline', title: 'Grounding 5-4-3-2-1', subtitle: 'Pull yourself back', href: '/grounding', tint: 'warning' },
  { icon: 'leaf-outline', title: 'Meditation', subtitle: 'Body scan, focus, calm', href: '/meditate', tint: 'primary' },
  { icon: 'moon-outline', title: 'Sleep tools', subtitle: 'Wind-down, sleep sounds', href: '/sleep', tint: 'info' },
  { icon: 'checkmark-circle-outline', title: 'Daily check-in', subtitle: 'Build the habit', href: '/checkin', tint: 'accent' },
  { icon: 'mic-outline', title: 'Anonymous voice therapy', subtitle: 'Speak, no judgment', href: '/voice-therapy', tint: 'info' },
  { icon: 'alert-circle-outline', title: 'Crisis SOS', subtitle: 'Hotlines & grounding', href: '/sos', tint: 'danger' },
];

export default function Tools() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text variant="display">Tools</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4, marginBottom: spacing.xl }}>
          Pick whatever fits how you feel right now.
        </Text>

        <View style={{ gap: spacing.md }}>
          {tools.map((t) => {
            const tint =
              t.tint === 'accent' ? colors.accent
              : t.tint === 'info' ? colors.info
              : t.tint === 'warning' ? colors.warning
              : t.tint === 'danger' ? colors.danger
              : colors.primary;
            return (
              <Pressable
                key={t.href}
                onPress={() => router.push(t.href as never)}
                accessibilityRole="button"
                accessibilityLabel={t.title}
                accessibilityHint={t.subtitle}
                style={({ pressed }) => [
                  styles.row,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
                  <Ionicons name={t.icon} size={22} color={tint} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{t.title}</Text>
                  <Text variant="caption" tone="dim">{t.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
