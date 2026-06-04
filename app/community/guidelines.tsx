import { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing } from '../../lib/theme';
import { useScreenTracking, Analytics } from '../../lib/analytics';
import { acceptGuidelines } from '../../lib/community';
import { tap } from '../../lib/haptics';

const RULES = [
  { icon: 'heart-outline', title: 'Share, don’t advise', text: 'Reflect and relate. No diagnosing, fixing, or “you should…”.' },
  { icon: 'shield-checkmark-outline', title: 'No comparison or judgment', text: 'Every struggle is valid here. We don’t rank pain.' },
  { icon: 'eye-off-outline', title: 'Stay anonymous', text: 'No real names, contacts, or identifying details — yours or anyone’s.' },
  { icon: 'alert-circle-outline', title: 'Crisis goes to humans', text: 'Circles aren’t monitored live. In danger? Use SOS for hotlines that answer now.' },
  { icon: 'flag-outline', title: 'Report what’s harmful', text: 'Flag or block anything cruel or unsafe. We review reports and remove content.' },
] as const;

export default function CommunityGuidelines() {
  useScreenTracking('community/guidelines');
  const { colors } = useTheme();
  const { circleId } = useLocalSearchParams<{ circleId?: string }>();
  const [saving, setSaving] = useState(false);

  async function accept() {
    if (saving) return;
    setSaving(true);
    await acceptGuidelines();
    void Analytics.track('community_guidelines_accepted', {});
    tap('success');
    // Replace so Back doesn't return to the gate.
    if (circleId) router.replace(`/community/${circleId}`);
    else router.replace('/community');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Before you join</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}>
        <Text variant="display">Circle agreement.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4, marginBottom: spacing.lg }}>
          Posting opens once you agree to keep this a gentle, safe space.
        </Text>

        <View style={{ gap: spacing.md }}>
          {RULES.map((r) => (
            <Card key={r.title}>
              <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={r.icon} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{r.title}</Text>
                  <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{r.text}</Text>
                </View>
              </View>
            </Card>
          ))}
        </View>

        <Text variant="caption" tone="dim" style={{ marginTop: spacing.lg, marginBottom: spacing.md }}>
          Posts that break these are removed, and accounts that repeatedly break them are blocked. By continuing you agree to these guidelines and to our zero-tolerance stance on abusive or harmful content.
        </Text>

        <Button label="I agree — let me in" icon="checkmark" fullWidth size="lg" loading={saving} onPress={accept} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  icon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
});
