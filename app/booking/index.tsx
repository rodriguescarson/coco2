import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing } from '../../lib/theme';
import { Storage, Booking } from '../../lib/storage';
import { DataWrite } from '../../lib/data-write';
import { tap } from '../../lib/haptics';
import { useScreenTracking, Analytics } from '../../lib/analytics';

export default function Bookings() {
  useScreenTracking('bookings');
  const { colors } = useTheme();
  const [list, setList] = useState<Booking[]>([]);

  const load = useCallback(async () => setList(await Storage.listBookings()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const upcoming = list.filter((b) => b.status === 'confirmed' && b.startsAt > Date.now()).sort((a, b) => a.startsAt - b.startsAt);
  const past = list.filter((b) => b.status !== 'confirmed' || b.startsAt <= Date.now()).sort((a, b) => b.startsAt - a.startsAt);

  function confirmCancel(id: string, name: string) {
    const doIt = async () => { await DataWrite.cancelBooking(id); void Analytics.track('booking_cancelled', { bookingId: id }); tap('warn'); load(); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Cancel session with ${name}?`)) doIt();
      return;
    }
    Alert.alert('Cancel session?', `Your session with ${name} will be cancelled.`, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Cancel session', style: 'destructive', onPress: doIt },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">My bookings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Bookings</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          {upcoming.length} upcoming · {past.length} past
        </Text>

        {upcoming.length === 0 && past.length === 0 ? (
          <Card tone="muted" style={{ marginTop: spacing.xl }}>
            <Text variant="bodyMedium">No bookings yet</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>Browse therapists to book your first session.</Text>
            <Button label="Find a therapist" icon="medkit-outline" style={{ marginTop: spacing.md }} onPress={() => router.push('/therapists')} />
          </Card>
        ) : null}

        {upcoming.length > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="subtitle">Upcoming</Text>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {upcoming.map((b) => (
                <Card key={b.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Pill label={b.modality === 'video' ? 'Video' : 'In person'} selected tone="primary" />
                    <Text variant="micro" tone="dim">{howFar(b.startsAt)}</Text>
                  </View>
                  <Text variant="bodyMedium" style={{ marginTop: 8 }}>{b.therapistName}</Text>
                  <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>
                    {new Date(b.startsAt).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </Text>
                  {b.notes ? (
                    <Text variant="caption" tone="dim" style={{ marginTop: 8, fontStyle: 'italic' }}>"{b.notes}"</Text>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                    <Button label="Reschedule" variant="secondary" size="sm" icon="calendar-outline" onPress={() => router.push(`/booking/${b.therapistId}`)} />
                    <Button label="Cancel" variant="ghost" size="sm" onPress={() => confirmCancel(b.id, b.therapistName)} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        ) : null}

        {past.length > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text variant="subtitle">Past & cancelled</Text>
            <View style={{ gap: spacing.md, marginTop: spacing.md }}>
              {past.slice(0, 20).map((b) => (
                <Card key={b.id} tone="muted">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Pill label={b.status === 'cancelled' ? 'Cancelled' : 'Done'} tone={b.status === 'cancelled' ? 'danger' : 'primary'} selected={b.status === 'cancelled'} />
                    <Text variant="micro" tone="dim">{new Date(b.startsAt).toLocaleDateString()}</Text>
                  </View>
                  <Text variant="bodyMedium" style={{ marginTop: 8 }}>{b.therapistName}</Text>
                </Card>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function howFar(ts: number): string {
  const m = Math.round((ts - Date.now()) / 60000);
  if (m < 60) return `in ${Math.max(m, 1)}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `in ${h}h`;
  const d = Math.round(h / 24);
  return `in ${d}d`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
