import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing } from '../lib/theme';
import { meditations, Meditation } from '../lib/data';
import { meditationCatalog, useTrack } from '../lib/audio';
import { tap } from '../lib/haptics';

const cats: { id: Meditation['category'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'mindfulness', label: 'Mindfulness' },
  { id: 'sleep', label: 'Sleep' },
  { id: 'focus', label: 'Focus' },
  { id: 'anxiety', label: 'Anxiety' },
];

export default function Meditate() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<typeof cats[number]['id']>('all');
  const [activeId, setActiveId] = useState<string | null>(null);

  const list = filter === 'all' ? meditations : meditations.filter((m) => m.category === filter);
  const source = useMemo(() => {
    if (!activeId) return null;
    const found = meditationCatalog.find((m) => m.id === activeId);
    return found ? { uri: found.uri } : null;
  }, [activeId]);

  const track = useTrack(source, { loop: false, volume: 0.85 });

  function play(id: string) {
    if (id === activeId) {
      track.toggle();
    } else {
      setActiveId(id);
      setTimeout(() => track.play(), 100);
      tap('success');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Meditate</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Text variant="display">Sit with yourself.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>Short, guided sessions for whatever's loud.</Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' }}>
          {cats.map((c) => (
            <Pill key={c.id} label={c.label} selected={filter === c.id} onPress={() => setFilter(c.id)} />
          ))}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {list.map((m) => {
            const isActive = activeId === m.id;
            const isPlaying = isActive && track.state.playing;
            return (
              <Card key={m.id} accessibilityLabel={`${m.title}, ${m.durationMin} minutes`}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconRound, { backgroundColor: isActive ? colors.primary : colors.primarySoft }]}>
                    <Ionicons name={iconFor(m.category)} size={20} color={isActive ? colors.primaryFg : colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.md }}>
                    <Text variant="bodyMedium">{m.title}</Text>
                    <Text variant="caption" tone="dim">{m.description}</Text>
                  </View>
                  <Text variant="caption" tone="dim" style={{ marginRight: spacing.sm }}>{m.durationMin} min</Text>
                  <Pressable
                    onPress={() => play(m.id)}
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.playBtn,
                      { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    {isActive && track.state.loading ? (
                      <ActivityIndicator size="small" color={colors.primaryFg} />
                    ) : (
                      <Ionicons name={isPlaying ? 'pause' : 'play'} size={16} color={colors.primaryFg} />
                    )}
                  </Pressable>
                </View>

                {isActive ? (
                  <View style={{ marginTop: spacing.md }}>
                    <ProgressBar
                      pos={track.state.positionMs}
                      total={track.state.durationMs || m.durationMin * 60_000}
                      colors={colors}
                    />
                  </View>
                ) : null}

                {isActive && track.error ? (
                  <Text variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>
                    Couldn't play: {track.error}
                  </Text>
                ) : null}
              </Card>
            );
          })}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            These tracks loop ambient backing audio while you settle in. Voice-guided scripts ship with the next content drop — pair with the breathing tool for a complete session.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProgressBar({ pos, total, colors }: { pos: number; total: number; colors: ReturnType<typeof useTheme>['colors'] }) {
  const pct = total > 0 ? Math.min(100, (pos / total) * 100) : 0;
  return (
    <View>
      <View style={{ height: 4, backgroundColor: colors.surfaceMuted, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.primary }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <Text variant="micro" tone="dim">{fmt(pos)}</Text>
        <Text variant="micro" tone="dim">{total > 0 ? fmt(total) : '—'}</Text>
      </View>
    </View>
  );
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function iconFor(c: Meditation['category']): keyof typeof Ionicons.glyphMap {
  if (c === 'sleep') return 'moon-outline';
  if (c === 'focus') return 'flash-outline';
  if (c === 'anxiety') return 'cloud-outline';
  return 'leaf-outline';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  iconRound: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

