import { ScrollView, View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTheme, spacing } from '../lib/theme';
import { crisisHotlines, groundingSteps } from '../lib/data';
import { tap } from '../lib/haptics';

export default function SOS() {
  const { colors } = useTheme();

  function call(phone: string) {
    tap('warn');
    if (!phone) return;
    const cleaned = phone.replace(/\s/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {});
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <View style={[styles.dot, { backgroundColor: colors.danger }]} />
        <Text variant="bodyMedium" tone="danger" style={{ flex: 1 }}>You are not alone</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Card tone="danger">
          <Text variant="title" tone="danger">If you are in immediate danger</Text>
          <Text variant="body" style={{ color: colors.danger, marginTop: 6 }}>
            Please call your local emergency number now. You deserve safety.
          </Text>
          <Button
            label={Platform.OS === 'ios' ? 'Call 911 / 112 / your local emergency' : 'Open emergency dialer'}
            variant="danger"
            icon="call"
            fullWidth
            style={{ marginTop: spacing.md }}
            onPress={() => call('112')}
          />
        </Card>

        <Section title="Hotlines & text lines" subtitle="24/7 trained listeners">
          {crisisHotlines.map((h, i) => (
            <Card key={i} style={{ marginTop: i === 0 ? 0 : spacing.md }}>
              <Text variant="micro" tone="dim">{h.region.toUpperCase()}</Text>
              <Text variant="bodyMedium" style={{ marginTop: 4 }}>{h.name}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                {h.phone ? (
                  <Button label={`Call ${h.phone}`} variant="primary" icon="call" size="sm" onPress={() => call(h.phone)} />
                ) : null}
                {h.text ? (
                  <Button
                    label={h.text}
                    variant="secondary"
                    icon="chatbubble-outline"
                    size="sm"
                    onPress={() => {
                      if (h.text?.startsWith('Text ') && h.region === 'United States') {
                        Linking.openURL('sms:741741?body=HOME').catch(() => {});
                      } else if (h.text?.includes('befrienders.org')) {
                        Linking.openURL('https://befrienders.org').catch(() => {});
                      }
                    }}
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </Section>

        <Section title="Ground yourself" subtitle="5-4-3-2-1, here, with me">
          <Card>
            {groundingSteps.map((s, i) => (
              <View key={s.sense} style={{ flexDirection: 'row', paddingVertical: 10, gap: spacing.md }}>
                <View style={[styles.numCircle, { backgroundColor: colors.primarySoft }]}>
                  <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>{5 - i}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{s.sense}</Text>
                  <Text variant="caption" tone="dim">{s.prompt}</Text>
                </View>
              </View>
            ))}
            <Button
              label="Open guided grounding"
              variant="secondary"
              fullWidth
              style={{ marginTop: spacing.md }}
              onPress={() => router.push('/grounding')}
            />
          </Card>
        </Section>

        <Section title="Slow your breath" subtitle="The fastest way to lower the alarm">
          <Card onPress={() => router.push('/breathe')} accessibilityLabel="Open breathing exercises">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="cloud-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Physiological sigh</Text>
                <Text variant="caption" tone="dim">Two inhales in, one long exhale out. ~60 seconds.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            Coco is not a substitute for emergency or medical care. If you are unsafe, please call your local emergency line.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="subtitle">{title}</Text>
      {subtitle ? <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  iconRound: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  numCircle: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

