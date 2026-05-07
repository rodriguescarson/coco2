import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { places, Place } from '../lib/data';
import { useScreenTracking } from '../lib/analytics';

const kinds: { id: Place['kind'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crisis', label: 'Crisis' },
  { id: 'clinic', label: 'Clinics' },
  { id: 'group', label: 'Groups' },
  { id: 'wellness', label: 'Wellness' },
];

export default function Places() {
  useScreenTracking('places');
  const { colors } = useTheme();
  const [filter, setFilter] = useState<typeof kinds[number]['id']>('all');
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    return places.filter((p) => {
      if (filter !== 'all' && p.kind !== filter) return false;
      if (q.trim()) {
        const needle = q.toLowerCase();
        return p.name.toLowerCase().includes(needle) || p.city.toLowerCase().includes(needle) || p.description.toLowerCase().includes(needle);
      }
      return true;
    });
  }, [filter, q]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Places</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Find help nearby.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Clinics, helplines, groups, wellness centers.</Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.lg }]}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search by name, city, or topic"
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, color: colors.text, fontSize: 16, marginLeft: 8 }}
            accessibilityLabel="Search places"
            returnKeyType="search"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
          {kinds.map((k) => (
            <Pill key={k.id} label={k.label} selected={filter === k.id} onPress={() => setFilter(k.id)} />
          ))}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {filtered.length === 0 && (
            <Card tone="muted">
              <Text tone="dim">No matches. Try clearing filters.</Text>
            </Card>
          )}
          {filtered.map((p) => (
            <Card key={p.id} accessibilityLabel={`${p.name}, ${p.city}`}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <Pill label={kindLabel(p.kind)} tone={p.kind === 'crisis' ? 'danger' : 'primary'} selected />
                <Text variant="micro" tone="dim">{p.city}</Text>
              </View>
              <Text variant="bodyMedium" style={{ marginTop: 8 }}>{p.name}</Text>
              <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>{p.description}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                {p.phone ? (
                  <Button
                    label={`Call ${p.phone}`}
                    icon="call"
                    size="sm"
                    variant={p.kind === 'crisis' ? 'danger' : 'primary'}
                    onPress={() => Linking.openURL(`tel:${p.phone?.replace(/\s/g, '')}`).catch(() => {})}
                  />
                ) : null}
                {p.website ? (
                  <Button
                    label="Website"
                    icon="open-outline"
                    size="sm"
                    variant="secondary"
                    onPress={() => Linking.openURL(p.website!).catch(() => {})}
                  />
                ) : null}
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function kindLabel(k: Place['kind']): string {
  if (k === 'crisis') return 'Crisis line';
  if (k === 'clinic') return 'Clinic';
  if (k === 'group') return 'Support group';
  return 'Wellness';
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
});
