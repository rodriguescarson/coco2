import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ScrollView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing, radius, type Colors } from '../../lib/theme';
import {
  Storage,
  todayKey,
  streakFromCheckins,
  type MoodEntry,
  type JournalEntry,
  type CheckinEntry,
} from '../../lib/storage';
import { DataWrite } from '../../lib/data-write';
import { useScreenTracking, Analytics } from '../../lib/analytics';
import {
  breathingPatterns,
  groundingSteps,
  dailyPrompts,
  journalPrompts,
  moodLabels,
  type BreathingPattern,
} from '../../lib/data';
import { tap } from '../../lib/haptics';

type TabKey = 'breathe' | 'ground' | 'mood' | 'reflect' | 'more';

const SEGMENTS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'breathe', label: 'Breathe', icon: 'cloud-outline' },
  { key: 'ground', label: 'Ground', icon: 'flower-outline' },
  { key: 'mood', label: 'Mood', icon: 'pulse-outline' },
  { key: 'reflect', label: 'Reflect', icon: 'create-outline' },
  { key: 'more', label: 'More', icon: 'grid-outline' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default function Tools() {
  useScreenTracking('tools');
  const { colors } = useTheme();
  const [tab, setTab] = useState<TabKey>('breathe');
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [checkins, setCheckins] = useState<CheckinEntry[]>([]);

  const load = useCallback(async () => {
    const [m, j, c] = await Promise.all([
      Storage.listMood(),
      Storage.listJournal(),
      Storage.listCheckin(),
    ]);
    setMoods(m);
    setJournals(j);
    setCheckins(c);
  }, []);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const since = Date.now() - WEEK_MS;
  const streak = streakFromCheckins(checkins);
  const moodWeek = moods.filter((m) => m.at >= since).length;
  const journalWeek = journals.filter((j) => j.at >= since).length;
  const checkedInToday = checkins.some((c) => c.date === todayKey());

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.lg }}>
        <Text variant="display">Tools</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>
          Do something for yourself right now — no detours.
        </Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <StatTile icon="flame" tint={colors.primary} value={String(streak)} label={streak === 1 ? 'day streak' : 'day streak'} />
          <StatTile icon="pulse" tint={colors.accent} value={String(moodWeek)} label="moods / wk" />
          <StatTile
            icon={checkedInToday ? 'checkmark-circle' : 'ellipse-outline'}
            tint={colors.info}
            value={checkedInToday ? 'Done' : '—'}
            label="check-in"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.lg }}
        >
          {SEGMENTS.map((s) => {
            const active = tab === s.key;
            return (
              <Pressable
                key={s.key}
                onPress={() => { setTab(s.key); tap('select'); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={s.label}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name={s.icon} size={16} color={active ? colors.primaryFg : colors.textDim} />
                <Text variant="caption" style={{ color: active ? colors.primaryFg : colors.textDim, fontWeight: '700', marginLeft: 6 }}>
                  {s.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ flex: 1 }}>
        {tab === 'breathe' && <BreathePanel />}
        {tab === 'ground' && <GroundPanel />}
        {tab === 'mood' && <MoodPanel moods={moods} onSaved={load} />}
        {tab === 'reflect' && <ReflectPanel journalWeek={journalWeek} onSaved={load} />}
        {tab === 'more' && <MorePanel />}
      </View>
    </SafeAreaView>
  );
}

function StatTile({ icon, tint, value, label }: { icon: keyof typeof Ionicons.glyphMap; tint: string; value: string; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Ionicons name={icon} size={14} color={tint} />
        <Text variant="subtitle" style={{ color: colors.text }}>{value}</Text>
      </View>
      <Text variant="micro" tone="faint" style={{ marginTop: 2 }}>{label.toUpperCase()}</Text>
    </View>
  );
}

/* ---------- Breathe ---------- */

function BreathePanel() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<BreathingPattern>(breathingPatterns[0]);
  const [running, setRunning] = useState(false);

  if (running) {
    return (
      <Animated.View entering={FadeInDown.duration(220)} style={styles.panelCenter}>
        <BreathOrb pattern={selected} onStop={() => setRunning(false)} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.panelScroll} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {breathingPatterns.map((p) => (
            <Pill key={p.id} label={p.name} selected={selected.id === p.id} onPress={() => { setSelected(p); tap('select'); }} />
          ))}
        </View>

        <Card style={{ marginTop: spacing.lg }} tone="primary">
          <Text variant="subtitle" tone="primary">{selected.name}</Text>
          <Text variant="body" tone="dim" style={{ marginTop: 6 }}>{selected.description}</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: spacing.md, flexWrap: 'wrap' }}>
            {selected.phases.map(([label, sec], i) => (
              <View key={i} style={[styles.phaseChip, { borderColor: colors.primary }]}>
                <Text variant="micro" tone="primary">{label} · {sec}s</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.md }}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />
            <Text variant="caption" tone="primary" style={{ marginLeft: 6 }}>{selected.benefit}</Text>
          </View>
        </Card>

        <Button label={`Begin ${selected.name}`} icon="play" fullWidth size="lg" style={{ marginTop: spacing.lg }} onPress={() => { setRunning(true); }} />
      </ScrollView>
    </Animated.View>
  );
}

function BreathOrb({ pattern, onStop }: { pattern: BreathingPattern; onStop: () => void }) {
  const { colors } = useTheme();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.7);
  const phaseRef = useRef(0);
  const cycleRef = useRef(1);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    phaseRef.current = 0;
    cycleRef.current = 1;
    setPhaseIdx(0);
    setCycle(1);
    startedAtRef.current = Date.now();
    void Analytics.track('breathing_started', { pattern: pattern.id, source: 'tools' });

    const advance = () => {
      if (cancelled) return;
      const [label, sec] = pattern.phases[phaseRef.current];
      const isInhale = label.toLowerCase().includes('inhale');
      const isExhale = label.toLowerCase().includes('exhale');
      const target = isInhale ? 1 : isExhale ? 0.55 : scale.value;
      const targetOpacity = isInhale ? 1 : isExhale ? 0.6 : opacity.value;
      scale.value = withTiming(target, { duration: sec * 1000, easing: Easing.inOut(Easing.cubic) });
      opacity.value = withTiming(targetOpacity, { duration: sec * 1000, easing: Easing.inOut(Easing.cubic) });
      tap('select');
      setTimeout(() => {
        if (cancelled) return;
        const nextPhase = (phaseRef.current + 1) % pattern.phases.length;
        if (nextPhase === 0) { cycleRef.current += 1; setCycle(cycleRef.current); }
        phaseRef.current = nextPhase;
        setPhaseIdx(nextPhase);
        advance();
      }, sec * 1000);
    };
    advance();

    return () => {
      cancelled = true;
      cancelAnimation(scale);
      cancelAnimation(opacity);
      void Analytics.track('breathing_ended', { pattern: pattern.id, cycles: cycleRef.current, durationMs: Date.now() - startedAtRef.current, source: 'tools' });
    };
  }, [pattern, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  const [label] = pattern.phases[phaseIdx];

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={[styles.ring, { borderColor: colors.primary }]}>
        <Animated.View style={[styles.orb, animStyle, { backgroundColor: colors.primary }]} />
      </View>
      <Text variant="title" style={{ marginTop: spacing.xxl }}>{label}</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 6 }}>{pattern.name} · cycle {cycle}</Text>
      <Pressable
        onPress={() => { onStop(); tap('select'); }}
        accessibilityRole="button"
        accessibilityLabel="End session"
        style={({ pressed }) => [styles.stop, { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text variant="bodyMedium">I'm good. End session.</Text>
      </Pressable>
    </View>
  );
}

/* ---------- Ground ---------- */

function GroundPanel() {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const total = groundingSteps.length;
  const startedAt = useRef(Date.now());

  useEffect(() => {
    void Analytics.track('grounding_started', { source: 'tools' });
    startedAt.current = Date.now();
  }, []);

  if (done) {
    return (
      <Animated.View entering={FadeInDown.duration(220)} style={styles.panelCenter}>
        <View style={[styles.numberRing, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
          <Ionicons name="leaf" size={56} color={colors.primary} />
        </View>
        <Text variant="title" style={{ marginTop: spacing.xxl }}>Back in your body.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: spacing.md, textAlign: 'center', maxWidth: 300 }}>
          You walked through all five senses. Notice how the ground feels under you now.
        </Text>
        <Button
          label="Run it again"
          variant="secondary"
          icon="refresh"
          style={{ marginTop: spacing.xl }}
          onPress={() => { setStep(0); setDone(false); startedAt.current = Date.now(); tap('select'); }}
        />
      </Animated.View>
    );
  }

  const current = groundingSteps[step];
  const remaining = total - step;
  const isLast = step === total - 1;

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ flex: 1 }}>
      <View style={styles.groundStep}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {groundingSteps.map((_, i) => (
            <View key={i} style={{ width: i === step ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= step ? colors.primary : colors.border }} />
          ))}
        </View>
        <View style={[styles.numberRing, { borderColor: colors.primary, backgroundColor: colors.primarySoft, marginTop: spacing.xl }]}>
          <Text variant="display" tone="primary" style={{ fontSize: 64, lineHeight: 72, textAlign: 'center' }}>{remaining}</Text>
        </View>
        <Text variant="title" style={{ marginTop: spacing.xl }}>{current.sense}</Text>
        <Text variant="body" tone="dim" style={{ marginTop: spacing.md, textAlign: 'center', maxWidth: 320 }}>
          {current.prompt}
        </Text>
      </View>
      <View style={{ padding: spacing.lg, paddingBottom: spacing.xl }}>
        <Button
          label={isLast ? 'Finish' : 'Next'}
          fullWidth
          size="lg"
          iconRight={isLast ? 'leaf-outline' : 'arrow-forward'}
          onPress={() => {
            tap('select');
            if (isLast) {
              void Analytics.track('grounding_completed', { durationMs: Date.now() - startedAt.current, source: 'tools' });
              setDone(true);
            } else {
              setStep(step + 1);
            }
          }}
        />
      </View>
    </Animated.View>
  );
}

/* ---------- Mood ---------- */

const MOOD_TAGS = ['Work', 'Sleep', 'Family', 'Money', 'Friends', 'Body', 'Lonely', 'Tired', 'Anxious', 'Calm'];

function MoodPanel({ moods, onSaved }: { moods: MoodEntry[]; onSaved: () => void }) {
  const { colors } = useTheme();
  const [score, setScore] = useState<MoodEntry['score'] | 0>(0);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  const last7 = moods.slice(0, 7).reverse();

  function toggle(t: string) { setTags((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t])); }

  async function save() {
    if (!score) return;
    const entry: MoodEntry = { id: `${Date.now()}`, score: score as MoodEntry['score'], tags, note: note.trim() || undefined, at: Date.now() };
    await DataWrite.addMood(entry);
    void Analytics.track('mood_logged', { score, hasNote: !!note.trim(), tagCount: tags.length, source: 'tools' });
    tap('success');
    setScore(0);
    setTags([]);
    setNote('');
    setSaved(true);
    onSaved();
  }

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ flex: 1 }}>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelScroll}>
        <View style={styles.faces}>
          {[1, 2, 3, 4, 5].map((s) => {
            const active = score === s;
            const tint = colors.moodColors[s - 1];
            return (
              <Pressable
                key={s}
                onPress={() => { setScore(s as MoodEntry['score']); setSaved(false); tap('select'); }}
                accessibilityRole="button"
                accessibilityLabel={`${moodLabels[s - 1]} mood`}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.face,
                  {
                    backgroundColor: colors.surface,
                    borderColor: active ? tint : colors.border,
                    borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 26 }}>{['😣', '😕', '😐', '🙂', '😊'][s - 1]}</Text>
                <Text variant="micro" tone="dim" style={{ marginTop: 4 }}>{moodLabels[s - 1]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text variant="caption" tone="dim" style={{ marginTop: spacing.lg }}>What's tied to it?</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
          {MOOD_TAGS.map((t) => (
            <Pill key={t} label={t} selected={tags.includes(t)} onPress={() => toggle(t)} />
          ))}
        </View>

        <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.lg }]}>
          <TextInput
            value={note}
            onChangeText={(v) => { setNote(v); setSaved(false); }}
            placeholder="Optional. A few words for future you."
            placeholderTextColor={colors.textFaint}
            style={{ color: colors.text, fontSize: 16, minHeight: 56 }}
            multiline
            accessibilityLabel="Mood note"
          />
        </View>

        <Button label="Save mood" icon="checkmark" fullWidth size="lg" disabled={!score} style={{ marginTop: spacing.lg }} onPress={save} />

        {saved ? (
          <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text variant="caption" tone="primary" style={{ marginLeft: 8, fontWeight: '600' }}>Logged. The trend below updated.</Text>
          </View>
        ) : null}

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>Your last week</Text>
        {last7.length > 0 ? (
          <Card style={{ marginTop: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 90 }}>
              {last7.map((m) => (
                <View
                  key={m.id}
                  accessibilityLabel={`${moodLabels[m.score - 1]} on ${new Date(m.at).toLocaleDateString()}`}
                  style={{ flex: 1, height: `${(m.score / 5) * 100}%`, backgroundColor: colors.moodColors[m.score - 1], borderRadius: 4 }}
                />
              ))}
            </View>
            <Text variant="caption" tone="dim" style={{ marginTop: spacing.sm }}>Last {last7.length} {last7.length === 1 ? 'entry' : 'entries'}</Text>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.md }} tone="muted">
            <Text variant="caption" tone="dim">Log your first mood to start seeing the trend here.</Text>
          </Card>
        )}
      </KeyboardAwareScrollView>
    </Animated.View>
  );
}

/* ---------- Reflect ---------- */

function ReflectPanel({ journalWeek, onSaved }: { journalWeek: number; onSaved: () => void }) {
  const { colors } = useTheme();
  const dayIndex = new Date().getDate() % dailyPrompts.length;
  const prompts = [dailyPrompts[dayIndex].feeling, ...journalPrompts.slice(0, 4)];
  const [prompt, setPrompt] = useState(prompts[0]);
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!body.trim()) return;
    const entry: JournalEntry = { id: `${Date.now()}`, body: body.trim(), prompt, at: Date.now() };
    await DataWrite.addJournal(entry);
    void Analytics.track('journal_created', { length: body.trim().length, source: 'tools' });
    tap('success');
    setBody('');
    setSaved(true);
    onSaved();
  }

  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ flex: 1 }}>
      <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.panelScroll}>
        <Text variant="micro" tone="dim">PROMPT — TAP TO SWAP</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
          {prompts.map((p, i) => (
            <Pill key={i} label={`#${i + 1}`} selected={prompt === p} onPress={() => { setPrompt(p); setSaved(false); tap('select'); }} />
          ))}
        </View>

        <Text variant="title" style={{ marginTop: spacing.lg }}>{prompt}</Text>

        <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.lg }]}>
          <TextInput
            value={body}
            onChangeText={(v) => { setBody(v); setSaved(false); }}
            placeholder="Write freely. Nobody else reads this."
            placeholderTextColor={colors.textFaint}
            style={{ color: colors.text, fontSize: 16, minHeight: 140 }}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Journal entry"
          />
        </View>

        <Button label="Save entry" icon="checkmark" fullWidth size="lg" disabled={!body.trim()} style={{ marginTop: spacing.lg }} onPress={save} />

        {saved ? (
          <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
            <Text variant="caption" tone="primary" style={{ marginLeft: 8, fontWeight: '600' }}>Saved to your journal.</Text>
          </View>
        ) : null}

        <Pressable
          onPress={() => { router.push('/journal'); tap('select'); }}
          accessibilityRole="button"
          accessibilityLabel="Open full journal"
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.xl, gap: 6 }}
        >
          <Ionicons name="book-outline" size={16} color={colors.textDim} />
          <Text variant="caption" tone="dim">
            {journalWeek > 0 ? `${journalWeek} ${journalWeek === 1 ? 'entry' : 'entries'} this week · ` : ''}Open full journal
          </Text>
        </Pressable>
      </KeyboardAwareScrollView>
    </Animated.View>
  );
}

/* ---------- More ---------- */

const MORE_TOOLS: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; href: string; tint: keyof Colors }[] = [
  { icon: 'leaf-outline', title: 'Meditation', subtitle: 'Body scan, focus, calm', href: '/meditate', tint: 'primary' },
  { icon: 'moon-outline', title: 'Sleep tools', subtitle: 'Wind-down, sounds', href: '/sleep', tint: 'info' },
  { icon: 'mic-outline', title: 'Voice therapy', subtitle: 'Speak, no judgment', href: '/voice-therapy', tint: 'info' },
  { icon: 'checkmark-circle-outline', title: 'Daily check-in', subtitle: 'Build the habit', href: '/checkin', tint: 'accent' },
  { icon: 'chatbubble-ellipses-outline', title: 'Talk to Coco', subtitle: 'AI listener', href: '/chat', tint: 'accent' },
  { icon: 'alert-circle-outline', title: 'Crisis SOS', subtitle: 'Hotlines & grounding', href: '/sos', tint: 'danger' },
];

function MorePanel() {
  const { colors } = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(220)} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.panelScroll} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
          {MORE_TOOLS.map((t) => {
            const tint = colors[t.tint] as string;
            return (
              <Pressable
                key={t.href}
                onPress={() => { router.push(t.href as never); tap('select'); }}
                accessibilityRole="button"
                accessibilityLabel={t.title}
                accessibilityHint={t.subtitle}
                style={({ pressed }) => [
                  styles.moreTile,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <View style={[styles.iconWrap, { backgroundColor: tint + '22' }]}>
                  <Ionicons name={t.icon} size={20} color={tint} />
                </View>
                <Text variant="bodyMedium" style={{ marginTop: spacing.md }}>{t.title}</Text>
                <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{t.subtitle}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statTile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  panelScroll: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxxl },
  panelCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  groundStep: { flex: 1, alignItems: 'center', justifyContent: 'flex-start', paddingTop: spacing.xl, paddingHorizontal: spacing.lg },
  phaseChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  ring: { width: 230, height: 230, borderRadius: 115, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  orb: { width: 196, height: 196, borderRadius: 98 },
  stop: { marginTop: spacing.xxxl, paddingVertical: 14, paddingHorizontal: spacing.xl, borderRadius: radius.pill, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  numberRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  faces: { flexDirection: 'row', gap: spacing.sm },
  face: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.lg },
  input: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  banner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  moreTile: {
    width: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
