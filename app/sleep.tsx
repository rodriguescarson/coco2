import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { meditations } from '../lib/data';
import { sleepSoundCatalog, useTrack } from '../lib/audio';
import { tap } from '../lib/haptics';

export default function Sleep() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const sleepMeds = meditations.filter((m) => m.category === 'sleep');

  const source = useMemo(() => {
    if (!selected) return null;
    const found = sleepSoundCatalog.find((s) => s.id === selected);
    return found ? { uri: found.uri } : null;
  }, [selected]);

  const track = useTrack(source, { loop: true, volume: 0.7 });

  function pick(id: string) {
    if (id === selected) {
      track.stop();
      setSelected(null);
      tap('select');
    } else {
      setSelected(id);
      // play kicks off after the source updates via useTrack
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
        <Text variant="bodyMedium">Sleep</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Wind down.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>Set the scene for sleep.</Text>

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>Sleep sounds</Text>
        <View style={[styles.grid, { marginTop: spacing.md }]}>
          {sleepSoundCatalog.map((s) => {
            const sel = selected === s.id;
            return (
              <Pressable
                key={s.id}
                onPress={() => pick(s.id)}
                accessibilityRole="button"
                accessibilityLabel={s.name}
                accessibilityState={{ selected: sel }}
                style={({ pressed }) => [
                  styles.soundTile,
                  {
                    backgroundColor: sel ? colors.primarySoft : colors.surface,
                    borderColor: sel ? colors.primary : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
                <Text variant="caption" style={{ marginTop: 6, textAlign: 'center' }}>{s.name}</Text>
                {sel ? (
                  <View style={[styles.playingDot, { backgroundColor: colors.primary }]}>
                    <Ionicons name={track.state.playing ? 'pause' : 'play'} size={10} color={colors.primaryFg} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {selected ? (
          <Card tone="primary" style={{ marginTop: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="caption" tone="primary">Now playing</Text>
                <Text variant="bodyMedium" tone="primary" style={{ marginTop: 2 }}>
                  {sleepSoundCatalog.find((s) => s.id === selected)?.name}
                </Text>
                {track.state.loading ? (
                  <Text variant="caption" tone="primary" style={{ marginTop: 4, opacity: 0.85 }}>buffering…</Text>
                ) : null}
              </View>
              <Pressable
                onPress={() => track.toggle()}
                accessibilityLabel={track.state.playing ? 'Pause' : 'Play'}
                hitSlop={12}
                style={[styles.playBtn, { backgroundColor: colors.primary }]}
              >
                {track.state.loading ? (
                  <ActivityIndicator color={colors.primaryFg} />
                ) : (
                  <Ionicons name={track.state.playing ? 'pause' : 'play'} size={22} color={colors.primaryFg} />
                )}
              </Pressable>
              <Pressable
                onPress={() => { track.stop(); setSelected(null); }}
                accessibilityLabel="Stop"
                hitSlop={12}
                style={[styles.stopBtn, { borderColor: colors.primary }]}
              >
                <Ionicons name="stop" size={18} color={colors.primary} />
              </Pressable>
            </View>
            {track.error ? (
              <Text variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>
                Couldn't play: {track.error}
              </Text>
            ) : null}
          </Card>
        ) : null}

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>Sleep meditations</Text>
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {sleepMeds.map((m) => (
            <Card key={m.id} onPress={() => router.push(`/meditate?id=${m.id}` as never)} accessibilityLabel={`${m.title}, ${m.durationMin} minutes`}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconRound, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="moon-outline" size={20} color={colors.info} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">{m.title}</Text>
                  <Text variant="caption" tone="dim">{m.description} · {m.durationMin} min</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
              </View>
            </Card>
          ))}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="bodyMedium">Sleep hygiene quick wins</Text>
          <View style={{ marginTop: spacing.sm, gap: 6 }}>
            {[
              'Same wake time, every day. Even after a bad night.',
              'No screens for the last 30 minutes.',
              'Cool, dark, quiet. Worth investing in.',
              "If you can't sleep after 20 minutes, get up. Read in low light. Return when sleepy.",
            ].map((tip, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Text variant="caption" tone="dim">•</Text>
                <Text variant="caption" tone="dim" style={{ flex: 1 }}>{tip}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Button
          label="Try the 4-7-8 breath instead"
          variant="secondary"
          icon="cloud-outline"
          fullWidth
          style={{ marginTop: spacing.xl }}
          onPress={() => router.replace('/breathe')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  soundTile: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
  },
  iconRound: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  playingDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginLeft: spacing.sm,
  },
});
