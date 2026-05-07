import { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { useTheme, spacing } from '../lib/theme';
import { meditations, Meditation } from '../lib/data';

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
  const list = filter === 'all' ? meditations : meditations.filter((m) => m.category === filter);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Meditate</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Sit with yourself.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>Short, guided sessions for whatever's loud.</Text>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg, flexWrap: 'wrap' }}>
          {cats.map((c) => (
            <Pill key={c.id} label={c.label} selected={filter === c.id} onPress={() => setFilter(c.id)} />
          ))}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {list.map((m) => (
            <Card key={m.id} accessibilityLabel={`${m.title}, ${m.durationMin} minutes`}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.iconRound, { backgroundColor: colors.primarySoft }]}>
                  <Ionicons name={iconFor(m.category)} size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text variant="bodyMedium">{m.title}</Text>
                  <Text variant="caption" tone="dim">{m.description}</Text>
                </View>
                <Text variant="caption" tone="dim">{m.durationMin} min</Text>
              </View>
            </Card>
          ))}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            Audio playback for guided sessions ships in a follow-up build. Today this catalog helps you pick — pair it with the breathing tool for a real session.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
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
});
