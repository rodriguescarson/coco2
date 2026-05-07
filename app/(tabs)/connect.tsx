import { ScrollView, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { useTheme, spacing } from '../../lib/theme';
import { therapists, places } from '../../lib/data';

export default function Connect() {
  const { colors } = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text variant="display">Connect</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4, marginBottom: spacing.xl }}>
          People, places, and communities. You don't have to do this alone.
        </Text>

        <Section title="People" subtitle="Vetted therapists and counselors">
          <Card onPress={() => router.push('/therapists')} accessibilityLabel="Browse all therapists">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Find a therapist</Text>
                <Text variant="caption" tone="dim">{therapists.length} clinicians worldwide · video & in-person</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Places" subtitle="Clinics, helplines, drop-in centers">
          <Card onPress={() => router.push('/places')} accessibilityLabel="Browse all places">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="location-outline" size={20} color={colors.accent} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Clinics & support centers</Text>
                <Text variant="caption" tone="dim">{places.length} resources across regions</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
            </View>
          </Card>
        </Section>

        <Section title="Community" subtitle="Anonymous and moderated">
          <View style={{ gap: spacing.md }}>
            <Card onPress={() => router.push('/community')} accessibilityLabel="Open community">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="people-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">Peer support circles</Text>
                  <Text variant="caption" tone="dim">Topic-based, anonymous, moderated</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </View>
            </Card>
            <Card onPress={() => router.push('/blog')} accessibilityLabel="Open articles">
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconRound, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="book-outline" size={20} color={colors.text} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">Articles & guides</Text>
                  <Text variant="caption" tone="dim">From clinicians and lived experience</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </View>
            </Card>
          </View>
        </Section>

        <Section title="Crisis support" subtitle="Available 24/7">
          <Card tone="danger" onPress={() => router.push('/sos')} accessibilityLabel="Open SOS">
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconRound, { backgroundColor: '#fff' }]}>
                <Ionicons name="call-outline" size={20} color={colors.danger} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium" tone="danger">Hotlines & grounding</Text>
                <Text variant="caption" tone="danger" style={{ opacity: 0.85 }}>
                  Tap if you or someone close needs immediate help
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.danger} />
            </View>
          </Card>
        </Section>
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
  iconRound: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

