import { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { Storage, MoodEntry } from '../lib/storage';
import { useEntitlement } from '../lib/useEntitlement';
import { useScreenTracking, Analytics } from '../lib/analytics';
import { tap } from '../lib/haptics';
import {
  computeInsights,
  reflection,
  scoreWord,
  PART_LABEL,
  WEEKDAY_LABEL,
  type Insights,
  type TagInsight,
} from '../lib/insights';

type RangeKey = '30' | '90' | 'all';
const RANGES: { key: RangeKey; label: string; days: number; pro: boolean }[] = [
  { key: '30', label: '30 days', days: 30, pro: false },
  { key: '90', label: '90 days', days: 90, pro: true },
  { key: 'all', label: 'All time', days: 3650, pro: true },
];

// Below this many mood logs there isn't enough to say anything honest yet.
const MIN_FOR_PATTERNS = 3;

export default function InsightsScreen() {
  useScreenTracking('insights');
  const { colors } = useTheme();
  const { isPro } = useEntitlement();
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [range, setRange] = useState<RangeKey>('30');

  const load = useCallback(async () => {
    const m = await Storage.listMood();
    setMoods(m);
    void Analytics.track('insights_viewed', { entries: m.length, isPro });
  }, [isPro]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const activeRange = RANGES.find((r) => r.key === range) ?? RANGES[0];
  const ins = useMemo(() => computeInsights(moods, activeRange.days), [moods, activeRange.days]);

  const enoughData = moods.length >= MIN_FOR_PATTERNS;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Insights</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Text variant="display">Your patterns.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          Drawn only from your own check-ins. Private to you — nothing here is shared.
        </Text>

        {!enoughData ? (
          <EmptyState />
        ) : (
          <>
            {/* Range selector — deeper windows are a Pro depth, 30 days is always free. */}
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
              {RANGES.map((r) => {
                const active = r.key === range;
                const locked = r.pro && !isPro;
                return (
                  <Pressable
                    key={r.key}
                    onPress={() => {
                      tap('select');
                      if (locked) router.push('/paywall');
                      else setRange(r.key);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={locked ? `${r.label}, Coco Pro` : r.label}
                    style={({ pressed }) => [
                      styles.rangeChip,
                      {
                        backgroundColor: active ? colors.primary : colors.surface,
                        borderColor: active ? colors.primary : colors.border,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                  >
                    <Text variant="caption" style={{ color: active ? colors.primaryFg : colors.textDim, fontWeight: '700' }}>
                      {r.label}
                    </Text>
                    {locked ? (
                      <Ionicons name="lock-closed" size={11} color={active ? colors.primaryFg : colors.textFaint} style={{ marginLeft: 5 }} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Reflection — always free. The gentle headline that makes logging feel worth it. */}
            <Card tone="primary" style={{ marginTop: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={15} color={colors.primary} />
                <Text variant="micro" tone="primary" style={{ marginLeft: 6 }}>THIS STRETCH</Text>
              </View>
              <Text variant="body" tone="primary" style={{ marginTop: spacing.sm, lineHeight: 22 }}>
                {reflection(ins)}
              </Text>
            </Card>

            {/* Mood trend — always free. */}
            <TrendCard ins={ins} />

            {/* What lifts / weighs — Pro depth. */}
            {isPro ? (
              <TagCard ins={ins} />
            ) : (
              <ProTeaser
                icon="trending-up-outline"
                title="What lifts you, what weighs on you"
                body="Coco Pro reads the tags on your check-ins to show which parts of life tend to lift your mood — and which tend to pull it down."
              />
            )}

            {/* Rhythm — Pro depth. */}
            {isPro ? (
              <RhythmCard ins={ins} />
            ) : (
              <ProTeaser
                icon="time-outline"
                title="The rhythm of your days"
                body="See which days of the week and times of day tend to feel lightest for you, so you can plan a little kindness around them."
              />
            )}

            <Text variant="caption" tone="faint" align="center" style={{ marginTop: spacing.xl, lineHeight: 18 }}>
              These are gentle observations from your own logs — not a diagnosis. If something feels heavy, the SOS button is always there, free.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyState() {
  const { colors } = useTheme();
  return (
    <Card tone="muted" style={{ marginTop: spacing.xl, alignItems: 'center', padding: spacing.xl }}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="pulse" size={28} color={colors.primary} />
      </View>
      <Text variant="subtitle" align="center" style={{ marginTop: spacing.md }}>A picture is forming.</Text>
      <Text variant="body" tone="dim" align="center" style={{ marginTop: spacing.sm, lineHeight: 22 }}>
        Log a few moods — with a tag or two — and Coco starts to show your trends, what lifts you, and the rhythm of your days.
      </Text>
      <Button label="Log a mood" icon="add" style={{ marginTop: spacing.lg }} onPress={() => router.push('/mood')} />
    </Card>
  );
}

function TrendCard({ ins }: { ins: Insights }) {
  const { colors } = useTheme();
  const { trend } = ins;
  const avg = trend.avg;

  const dir = trend.direction;
  const dirIcon = dir === 'up' ? 'arrow-up' : dir === 'down' ? 'arrow-down' : 'remove';
  const dirTint = dir === 'up' ? colors.primary : dir === 'down' ? colors.accent : colors.textFaint;
  const dirText = dir === 'up' ? 'Brighter than before' : dir === 'down' ? 'Heavier than before' : dir === 'steady' ? 'Holding steady' : 'Not enough yet to compare';

  const maxBars = trend.weekly.length;

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="subtitle">Mood trend</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
        Across {trend.count} {trend.count === 1 ? 'check-in' : 'check-ins'} in this window.
      </Text>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View>
            <Text variant="display" style={{ fontSize: 40, lineHeight: 44 }}>{avg !== null ? avg.toFixed(1) : '—'}</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>
              {avg !== null ? `${scoreWord(avg)} on average` : 'no logs in this window'}
            </Text>
          </View>
          <View style={[styles.dirChip, { backgroundColor: colors.surfaceMuted }]}>
            <Ionicons name={dirIcon} size={13} color={dirTint} />
            <Text variant="micro" style={{ color: dirTint, marginLeft: 5 }}>{dirText}</Text>
          </View>
        </View>

        {/* Weekly sparkline. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 72, marginTop: spacing.lg }}>
          {trend.weekly.map((w, i) => {
            const has = w.count > 0;
            const tint = has ? colors.moodColors[Math.min(4, Math.max(0, Math.round(w.avg) - 1))] : colors.surfaceMuted;
            return (
              <View
                key={w.weekStart}
                accessibilityLabel={has ? `Week ${i + 1}: average ${w.avg}` : `Week ${i + 1}: no logs`}
                style={{ flex: 1, height: has ? `${Math.max(8, (w.avg / 5) * 100)}%` : 6, backgroundColor: tint, borderRadius: 4, opacity: has ? 1 : 0.5 }}
              />
            );
          })}
        </View>
        <Text variant="micro" tone="faint" style={{ marginTop: spacing.sm }}>
          {maxBars > 1 ? `Weekly average · oldest to most recent` : 'Weekly average'}
        </Text>
      </Card>
    </View>
  );
}

function TagRow({ t, kind }: { t: TagInsight; kind: 'lift' | 'weigh' }) {
  const { colors } = useTheme();
  const tint = kind === 'lift' ? colors.primary : colors.accent;
  const sign = t.delta > 0 ? '+' : '';
  return (
    <View style={styles.tagRow}>
      <View style={[styles.tagDot, { backgroundColor: tint }]} />
      <Text variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.md }}>{t.tag}</Text>
      <Text variant="caption" tone="dim" style={{ marginRight: spacing.md }}>{t.count}×</Text>
      <Text variant="bodyMedium" style={{ color: tint, fontWeight: '700' }}>{sign}{t.delta.toFixed(1)}</Text>
    </View>
  );
}

function TagCard({ ins }: { ins: Insights }) {
  const { colors } = useTheme();
  const hasAny = ins.lifts.length > 0 || ins.weighs.length > 0;
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="subtitle">What lifts you, what weighs</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
        How your mood sits when each tag is part of the day, next to your average.
      </Text>
      <Card style={{ padding: 0 }}>
        {!hasAny ? (
          <View style={{ padding: spacing.lg }}>
            <Text variant="caption" tone="dim">
              Add a tag or two when you log a mood — once a tag shows up a few times, its pattern appears here.
            </Text>
          </View>
        ) : (
          <View style={{ padding: spacing.lg, gap: spacing.md }}>
            {ins.lifts.length > 0 ? (
              <>
                <Text variant="micro" tone="primary">TENDS TO LIFT YOU</Text>
                {ins.lifts.map((t) => <TagRow key={t.tag} t={t} kind="lift" />)}
              </>
            ) : null}
            {ins.weighs.length > 0 ? (
              <>
                <Text variant="micro" style={{ color: colors.accent, marginTop: ins.lifts.length ? spacing.sm : 0 }}>TENDS TO WEIGH ON YOU</Text>
                {ins.weighs.map((t) => <TagRow key={t.tag} t={t} kind="weigh" />)}
              </>
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

function RhythmCard({ ins }: { ins: Insights }) {
  const { colors } = useTheme();
  const day = ins.brightestDay;
  const parts = ins.partsOfDay.filter((p) => p.count >= 2);
  const brightestPart = parts[0];
  const nothing = !day && !brightestPart;

  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="subtitle">The rhythm of your days</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
        When the lighter moments tend to land.
      </Text>
      <Card>
        {nothing ? (
          <Text variant="caption" tone="dim">A few more check-ins across different days and times, and your rhythm shows up here.</Text>
        ) : (
          <View style={{ gap: spacing.md }}>
            {day ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.rhythmIcon, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name="sunny-outline" size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">{WEEKDAY_LABEL[day.day]} feel lightest</Text>
                  <Text variant="caption" tone="dim">averaging {scoreWord(day.avg)} ({day.avg.toFixed(1)})</Text>
                </View>
              </View>
            ) : null}
            {brightestPart ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.rhythmIcon, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons name="partly-sunny-outline" size={18} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">Your {PART_LABEL[brightestPart.part]} tend to be brighter</Text>
                  <Text variant="caption" tone="dim">averaging {scoreWord(brightestPart.avg)} ({brightestPart.avg.toFixed(1)})</Text>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </Card>
    </View>
  );
}

function ProTeaser({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => { tap('select'); router.push('/paywall'); }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. Unlock with Coco Pro.`}
      style={({ pressed }) => [
        styles.teaser,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.rhythmIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.md }}>{title}</Text>
        <View style={[styles.proPill, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="lock-closed" size={11} color={colors.primary} />
          <Text variant="micro" tone="primary" style={{ marginLeft: 4 }}>PRO</Text>
        </View>
      </View>
      <Text variant="caption" tone="dim" style={{ marginTop: spacing.md, lineHeight: 19 }}>{body}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
        <Text variant="caption" tone="primary" style={{ fontWeight: '700' }}>Unlock with Coco Pro</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  rangeChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth },
  dirChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill },
  tagRow: { flexDirection: 'row', alignItems: 'center' },
  tagDot: { width: 8, height: 8, borderRadius: 4 },
  rhythmIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  teaser: { marginTop: spacing.xl, padding: spacing.lg, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth },
  proPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
});
