import { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { therapists, Therapist } from '../lib/data';

const modalities: { id: Therapist['modality'] | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'video', label: 'Video' },
  { id: 'in-person', label: 'In person' },
  { id: 'both', label: 'Hybrid' },
];

export default function Therapists() {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const [modality, setModality] = useState<typeof modalities[number]['id']>('all');

  const list = useMemo(() => {
    return therapists.filter((t) => {
      if (modality !== 'all' && t.modality !== modality) return false;
      if (!q.trim()) return true;
      const needle = q.toLowerCase();
      return (
        t.name.toLowerCase().includes(needle) ||
        t.city.toLowerCase().includes(needle) ||
        t.specialties.some((s) => s.toLowerCase().includes(needle))
      );
    });
  }, [q, modality]);

  function book(id: string) {
    router.push(`/booking/${id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Therapists</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Therapists</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>{list.length} clinicians available</Text>

        <View style={[styles.search, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.lg }]}>
          <Ionicons name="search" size={18} color={colors.textFaint} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Specialty, city, name"
            placeholderTextColor={colors.textFaint}
            style={{ flex: 1, color: colors.text, fontSize: 16, marginLeft: 8 }}
            accessibilityLabel="Search therapists"
            returnKeyType="search"
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
          {modalities.map((m) => (
            <Pill key={m.id} label={m.label} selected={modality === m.id} onPress={() => setModality(m.id)} />
          ))}
        </View>

        <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
          {list.map((t) => (
            <Card key={t.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                <View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}>
                  <Text variant="bodyMedium" tone="primary" style={{ fontWeight: '700' }}>
                    {t.name.split(' ').slice(-1)[0]?.[0] ?? 'T'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium">{t.name}</Text>
                  <Text variant="caption" tone="dim">{t.credentials}</Text>
                </View>
                {t.online ? (
                  <View style={[styles.onlineDot, { backgroundColor: colors.primary }]} accessibilityLabel="Online now" />
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' }}>
                {t.specialties.map((s) => (
                  <Pill key={s} label={s} />
                ))}
                <Pill label={t.modality === 'both' ? 'Hybrid' : t.modality === 'video' ? 'Video' : 'In person'} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md }}>
                <Text variant="caption" tone="dim">{t.city} · {t.rate}</Text>
                <Button label="Book" size="sm" icon="calendar-outline" onPress={() => book(t.id)} />
              </View>
            </Card>
          ))}
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            Booking holds a slot and pings the therapist by email. They confirm within 24 hours. Cancel free up to 12 hours before your session from Profile → My bookings.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  search: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
});
