import { ScrollView, View, StyleSheet, Pressable, Image, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing, radius } from '../lib/theme';

const team = [
  { name: 'Carson Rodrigues', role: 'Builder' },
  { name: 'OYSTURN Vas', role: 'Builder' },
  { name: "Rea D'Souza", role: 'Builder' },
  { name: 'Druvi Tendulkar', role: 'Builder' },
  { name: 'Yash Karapurkar', role: 'Builder' },
  { name: 'Jaysel Silveira', role: 'Builder' },
];

const mentors = [
  { name: 'Dr. Vivek Jog', role: 'Mentor' },
  { name: 'Prof. Amey Kerkar', role: 'Mentor' },
];

const thanks = [
  { name: 'Fr. Kinley D’Cruz', role: 'Director, Don Bosco College of Engineering' },
  { name: 'Dr. Neena Panandikar', role: 'Principal' },
  { name: 'Dr. Gaurang S. Patkar', role: 'Head of Department' },
  { name: 'Mayalin Noronha', role: 'Counsellor — clinical guidance' },
  { name: 'Stella Tom', role: 'SIH coaching' },
];

export default function About() {
  const { colors } = useTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">About Coco</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.lg }}>
          <Text variant="micro" tone="dim">SMART INDIA HACKATHON 2022 · GRAND FINALE</Text>
          <Text variant="display" style={{ marginTop: 6 }}>Where Coco started.</Text>
          <Text variant="body" tone="dim" style={{ marginTop: spacing.md, lineHeight: 24 }}>
            Coco began as the Green Ribbon Army's submission to SIH 2022, hosted at KLE Institute of Technology, Hubli. We built an app for better assessment and surveillance of student mental health — a problem that still doesn't get the attention it deserves.
          </Text>
          <Text variant="body" tone="dim" style={{ marginTop: spacing.md, lineHeight: 24 }}>
            What you're holding now is that idea, regrown. New stack, new tools, the same intent: make it a little easier to feel a little less alone.
          </Text>
        </View>

        <PhotoCard colors={colors} />

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text variant="subtitle">Green Ribbon Army</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            The team that took Coco to the Grand Finale.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {team.map((m) => (
              <PersonRow key={m.name} name={m.name} role={m.role} colors={colors} />
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text variant="subtitle">Mentors</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Guidance during the build.
          </Text>
          <View style={{ gap: spacing.sm }}>
            {mentors.map((m) => (
              <PersonRow key={m.name} name={m.name} role={m.role} colors={colors} accent />
            ))}
          </View>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text variant="subtitle">Thanks to</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            People without whom this didn't happen.
          </Text>
          <Card style={{ padding: 0 }}>
            {thanks.map((t, i) => (
              <View key={t.name}>
                <View style={{ padding: spacing.lg }}>
                  <Text variant="bodyMedium">{t.name}</Text>
                  <Text variant="caption" tone="dim">{t.role}</Text>
                </View>
                {i < thanks.length - 1 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} /> : null}
              </View>
            ))}
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text variant="subtitle">A short note</Text>
          <Card tone="muted" style={{ marginTop: spacing.md }}>
            <Text variant="body" style={{ lineHeight: 22 }}>
              All good things come to an end — and then they begin again. SIH was a stupendous experience. Coco is the part of it I refused to let go.
            </Text>
            <Text variant="body" style={{ lineHeight: 22, marginTop: spacing.sm }}>
              If this app helps even one person breathe easier, the Green Ribbon Army's work was worth it.
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
              <Pill label="#SIH2022" />
              <Pill label="#Hackathon" />
              <Pill label="#MentalHealth" />
            </View>
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          <Text variant="subtitle">The build, today</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Modern stack, same heart.
          </Text>
          <Card style={{ padding: 0 }}>
            <Row label="Frontend" value="Expo SDK 54 · React 19 · React Native 0.81" colors={colors} />
            <Divider colors={colors} />
            <Row label="Routing" value="Expo Router" colors={colors} />
            <Divider colors={colors} />
            <Row label="Animation" value="Reanimated 4 + Worklets" colors={colors} />
            <Divider colors={colors} />
            <Row label="AI companion" value="Groq · Llama 3.3 70B · Vercel Edge" colors={colors} />
            <Divider colors={colors} />
            <Row label="Sync" value="Firebase Auth + Firestore" colors={colors} />
            <Divider colors={colors} />
            <Row label="Designed by" value="Carson Rodrigues" colors={colors} />
          </Card>

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' }}>
            <Pressable
              onPress={() => Linking.openURL('https://github.com/rodriguescarson/coco2').catch(() => {})}
              style={({ pressed }) => [styles.linkBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="logo-github" size={16} color={colors.text} />
              <Text variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>Source on GitHub</Text>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL('https://www.sih.gov.in').catch(() => {})}
              style={({ pressed }) => [styles.linkBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}
            >
              <Ionicons name="open-outline" size={16} color={colors.text} />
              <Text variant="caption" style={{ marginLeft: 6, fontWeight: '600' }}>Smart India Hackathon</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoCard({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
      <View style={[styles.photoFrame, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        {Platform.OS === 'web' ? (
          // On web we can show a fallback collage; replace with a real image at /assets/about/team.jpg
          <Image
            source={require('../assets/icon.png')}
            style={styles.photoFallback}
            accessibilityLabel="Green Ribbon Army at SIH 2022 Grand Finale"
          />
        ) : (
          <Image
            source={require('../assets/icon.png')}
            style={styles.photoFallback}
            accessibilityLabel="Green Ribbon Army at SIH 2022 Grand Finale"
          />
        )}
        <View style={styles.photoCaption}>
          <Text variant="micro" tone="onPrimary" style={{ opacity: 0.85 }}>HUBLI · 25 AUG 2022</Text>
          <Text variant="bodyMedium" tone="onPrimary">Green Ribbon Army at SIH Grand Finale</Text>
          <Text variant="caption" tone="onPrimary" style={{ opacity: 0.85, marginTop: 4 }}>
            Drop the team photo at assets/about/team.jpg to replace this placeholder.
          </Text>
        </View>
      </View>
    </View>
  );
}

function PersonRow({ name, role, colors, accent }: { name: string; role: string; colors: ReturnType<typeof useTheme>['colors']; accent?: boolean }) {
  const initial = name
    .replace(/^(Dr\.|Prof\.|Fr\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('');

  return (
    <View style={[styles.personRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: accent ? colors.accentSoft : colors.primarySoft }]}>
        <Text variant="bodyMedium" style={{ color: accent ? colors.accent : colors.primary, fontWeight: '700' }}>{initial}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text variant="bodyMedium">{name}</Text>
        <Text variant="caption" tone="dim">{role}</Text>
      </View>
    </View>
  );
}

function Row({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors'] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
      <Text variant="caption" tone="dim" style={{ width: 110 }}>{label}</Text>
      <Text variant="caption" style={{ flex: 1, fontWeight: '500', color: colors.text }}>{value}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg }} />;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  photoFrame: {
    height: 220,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'flex-end',
  },
  photoFallback: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.18,
    resizeMode: 'cover',
  },
  photoCaption: {
    backgroundColor: 'rgba(14, 138, 95, 0.92)',
    padding: spacing.lg,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
