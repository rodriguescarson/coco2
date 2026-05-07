import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, cancelAnimation } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { useTheme, spacing, radius } from '../lib/theme';
import { breathingPatterns, BreathingPattern } from '../lib/data';
import { tap } from '../lib/haptics';

export default function Breathe() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<BreathingPattern>(breathingPatterns[0]);
  const [running, setRunning] = useState(false);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Breathe</Text>
        <View style={{ width: 28 }} />
      </View>

      {!running ? (
        <View style={{ padding: spacing.lg, flex: 1 }}>
          <Text variant="display">Breathe.</Text>
          <Text variant="body" tone="dim" style={{ marginTop: 4 }}>
            Pick a pattern. Coco guides the rhythm.
          </Text>

          <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
            {breathingPatterns.map((p) => (
              <Card
                key={p.id}
                onPress={() => setSelected(p)}
                tone={selected.id === p.id ? 'primary' : 'surface'}
                accessibilityLabel={p.name}
                accessibilityHint={p.description}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium">{p.name}</Text>
                    <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{p.description}</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                      {p.phases.map(([label, sec], i) => (
                        <View key={i} style={[styles.phaseChip, { borderColor: colors.border }]}>
                          <Text variant="micro" style={{ color: colors.textDim }}>{label} · {sec}s</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  {selected.id === p.id ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
                </View>
              </Card>
            ))}
          </View>

          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => { setRunning(true); tap('select'); }}
            accessibilityRole="button"
            accessibilityLabel={`Begin ${selected.name}`}
            style={({ pressed }) => [
              styles.start,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text variant="bodyMedium" style={{ color: colors.primaryFg, fontWeight: '700' }}>Begin {selected.name}</Text>
          </Pressable>
        </View>
      ) : (
        <BreathRunner pattern={selected} onExit={() => setRunning(false)} />
      )}
    </SafeAreaView>
  );
}

function BreathRunner({ pattern, onExit }: { pattern: BreathingPattern; onExit: () => void }) {
  const { colors } = useTheme();
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.7);
  const phaseRef = useRef(0);
  const cycleRef = useRef(1);

  useEffect(() => {
    phaseRef.current = 0;
    cycleRef.current = 1;
    setPhaseIdx(0);
    setCycle(1);
    let cancelled = false;

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
        if (nextPhase === 0) {
          cycleRef.current += 1;
          setCycle(cycleRef.current);
        }
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
    };
  }, [pattern, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const [label] = pattern.phases[phaseIdx];

  return (
    <View style={{ flex: 1, padding: spacing.lg }}>
      <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
        <View style={[styles.ring, { borderColor: colors.primary }]}>
          <Animated.View
            style={[
              styles.orb,
              animStyle,
              { backgroundColor: colors.primary },
            ]}
          />
        </View>
        <Text variant="title" style={{ marginTop: spacing.xxxl }}>{label}</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 6 }}>{pattern.name} · cycle {cycle}</Text>
      </View>
      <Pressable
        onPress={() => { onExit(); tap('select'); }}
        accessibilityRole="button"
        accessibilityLabel="Stop"
        style={({ pressed }) => [
          styles.stop,
          { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text variant="bodyMedium">I'm good. End session.</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  phaseChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  start: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stop: {
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  ring: {
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 240,
    height: 240,
    borderRadius: 120,
  },
});
