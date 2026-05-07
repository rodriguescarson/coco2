import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, RefreshControl, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing, radius } from '../../lib/theme';
import { Storage, streakFromCheckins, todayKey, MoodEntry, CheckinEntry, UserProfile } from '../../lib/storage';
import { dailyPrompts, moodLabels } from '../../lib/data';
import { SafeAreaView } from 'react-native-safe-area-context';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Resting hours';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 22) return 'Good evening';
  return 'Late night';
}

export default function Home() {
  const { colors } = useTheme();
  const [user, setUser] = useState<UserProfile>({});
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [u, m, c] = await Promise.all([Storage.getUser(), Storage.listMood(), Storage.listCheckin()]);
    setUser(u);
    setMoods(m);
    setCheckins(c);
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  useEffect(() => {
    load();
  }, []);

  const streak = streakFromCheckins(checkins);
  const checkedInToday = checkins.some((c) => c.date === todayKey());
  const lastMood = moods[0];
  const dayIndex = new Date().getDate() % dailyPrompts.length;
  const todayPrompt = dailyPrompts[dayIndex];

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting + SOS */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="micro" tone="dim">{greeting().toUpperCase()}</Text>
            <Text variant="display" style={{ marginTop: 4 }}>
              {user.name ? `Hi, ${user.name}` : 'Hi, friend'}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/sos')}
            accessibilityRole="button"
            accessibilityLabel="Crisis SOS"
            accessibilityHint="Opens crisis hotlines and grounding tools"
            hitSlop={8}
            style={({ pressed }) => [
              styles.sos,
              { backgroundColor: colors.dangerSoft, borderColor: colors.danger, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text variant="caption" style={{ color: colors.danger, fontWeight: '700', marginLeft: 4 }}>SOS</Text>
          </Pressable>
        </View>

        {/* Hero check-in card */}
        <Pressable
          onPress={() => router.push(checkedInToday ? '/checkin' : '/checkin')}
          accessibilityRole="button"
          accessibilityLabel={checkedInToday ? "Today's check-in complete" : 'Start daily check-in'}
        >
          <LinearGradient
            colors={[colors.primary, colors.primary + 'C0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.hero, { borderRadius: radius.xl }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text variant="micro" style={{ color: colors.primaryFg, opacity: 0.8 }}>TODAY</Text>
                <Text variant="title" style={{ color: colors.primaryFg, marginTop: 6 }}>
                  {checkedInToday ? 'Checked in.' : 'How are you arriving?'}
                </Text>
                <Text variant="body" style={{ color: colors.primaryFg, opacity: 0.85, marginTop: 6, maxWidth: 240 }}>
                  {checkedInToday ? todayPrompt.reflection : todayPrompt.feeling}
                </Text>
              </View>
              <View style={[styles.streakBadge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
                <Text variant="caption" style={{ color: colors.primaryFg, opacity: 0.85 }}>STREAK</Text>
                <Text variant="title" style={{ color: colors.primaryFg }}>{streak}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: spacing.lg }}>
              <Button
                label={checkedInToday ? 'Edit today' : 'Start check-in'}
                variant="secondary"
                size="sm"
                iconRight="arrow-forward"
                onPress={() => router.push('/checkin')}
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Mood snapshot */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="subtitle">Quick mood</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>One tap. We track the trend.</Text>
          <MoodPicker onPicked={async (score) => {
            await Storage.addMood({ id: `${Date.now()}`, score: score as MoodEntry['score'], at: Date.now() });
            const m = await Storage.listMood();
            setMoods(m);
          }} lastScore={lastMood?.score} />
          {moods.length > 0 && (
            <Text variant="caption" tone="dim" style={{ marginTop: spacing.sm }}>
              Last: {moodLabels[(lastMood.score as number) - 1]} · {timeAgo(lastMood.at)}
            </Text>
          )}
        </View>

        {/* Quick actions */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="subtitle">For right now</Text>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <ActionTile
              icon="cloud-outline"
              title="Breathe"
              subtitle="2 min reset"
              onPress={() => router.push('/breathe')}
              tint={colors.primary}
            />
            <ActionTile
              icon="chatbubble-ellipses-outline"
              title="Talk to Coco"
              subtitle="AI listener"
              onPress={() => router.push('/chat')}
              tint={colors.accent}
            />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
            <ActionTile
              icon="moon-outline"
              title="Wind down"
              subtitle="Sleep tools"
              onPress={() => router.push('/sleep')}
              tint={colors.info}
            />
            <ActionTile
              icon="flower-outline"
              title="Ground"
              subtitle="5-4-3-2-1"
              onPress={() => router.push('/grounding')}
              tint={colors.warning}
            />
          </View>
        </View>

        {/* Today's reflection */}
        <Card style={{ marginTop: spacing.xl }} onPress={() => router.push('/journal/new')}
          accessibilityLabel="Open journal prompt"
        >
          <Text variant="micro" tone="dim">REFLECTION</Text>
          <Text variant="subtitle" style={{ marginTop: 6 }}>{todayPrompt.feeling}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text variant="caption" tone="primary" style={{ marginLeft: 6, fontWeight: '600' }}>Write a journal entry</Text>
          </View>
        </Card>

        <Card style={{ marginTop: spacing.lg }} onPress={() => router.push('/therapists')}
          accessibilityLabel="Browse therapists"
          tone="muted"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.iconRound, { backgroundColor: colors.surface }]}>
              <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text variant="bodyMedium">Talk to a real therapist</Text>
              <Text variant="caption" tone="dim">Browse vetted clinicians worldwide</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function MoodPicker({ onPicked, lastScore }: { onPicked: (score: number) => void; lastScore?: number }) {
  const { colors } = useTheme();
  const faces: { score: number; emoji: string; label: string }[] = [
    { score: 1, emoji: '😣', label: 'Awful' },
    { score: 2, emoji: '😕', label: 'Low' },
    { score: 3, emoji: '😐', label: 'Okay' },
    { score: 4, emoji: '🙂', label: 'Good' },
    { score: 5, emoji: '😊', label: 'Great' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
      {faces.map((f) => {
        const isLast = lastScore === f.score;
        const tint = colors.moodColors[f.score - 1];
        return (
          <Pressable
            key={f.score}
            onPress={() => onPicked(f.score)}
            accessibilityRole="button"
            accessibilityLabel={`Mood: ${f.label}`}
            style={({ pressed }) => [
              {
                flex: 1,
                aspectRatio: 1,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surface,
                borderWidth: isLast ? 2 : StyleSheet.hairlineWidth,
                borderColor: isLast ? tint : colors.border,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text style={{ fontSize: 26 }}>{f.emoji}</Text>
            <Text variant="micro" tone="dim" style={{ marginTop: 4 }}>{f.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ActionTile({
  icon, title, subtitle, onPress, tint,
}: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; onPress: () => void; tint: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={[styles.iconRound, { backgroundColor: tint + '22' }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text variant="bodyMedium" style={{ marginTop: 12 }}>{title}</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{subtitle}</Text>
    </Pressable>
  );
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sos: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  hero: {
    padding: spacing.xl,
    overflow: 'hidden',
  },
  streakBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  tile: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconRound: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
