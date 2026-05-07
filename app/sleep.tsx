import { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { sleepSounds, meditations } from '../lib/data';
import { tap } from '../lib/haptics';

export default function Sleep() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const sleepMeds = meditations.filter((m) => m.category === 'sleep');

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
          {sleepSounds.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => { setSelected(selected === s.id ? null : s.id); tap('select'); }}
              accessibilityRole="button"
              accessibilityLabel={s.name}
              accessibilityState={{ selected: selected === s.id }}
              style={({ pressed }) => [
                styles.soundTile,
                {
                  backgroundColor: selected === s.id ? colors.primarySoft : colors.surface,
                  borderColor: selected === s.id ? colors.primary : colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={{ fontSize: 32 }}>{s.emoji}</Text>
              <Text variant="caption" style={{ marginTop: 6, textAlign: 'center' }}>{s.name}</Text>
            </Pressable>
          ))}
        </View>

        {selected ? (
          <Card tone="primary" style={{ marginTop: spacing.lg }}>
            <Text variant="caption" tone="primary">
              Audio streaming for sleep sounds is in the next build. Stub selected: {sleepSounds.find((s) => s.id === selected)?.name}.
            </Text>
          </Card>
        ) : null}

        <Text variant="subtitle" style={{ marginTop: spacing.xl }}>Sleep meditations</Text>
        <View style={{ gap: spacing.md, marginTop: spacing.md }}>
          {sleepMeds.map((m) => (
            <Card key={m.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconRound, { backgroundColor: colors.surfaceMuted }]}>
                  <Ionicons name="moon-outline" size={20} color={colors.info} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">{m.title}</Text>
                  <Text variant="caption" tone="dim">{m.description} · {m.durationMin} min</Text>
                </View>
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
              'If you can\'t sleep after 20 minutes, get up. Read in low light. Return when sleepy.',
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
});
