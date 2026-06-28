import { useCallback, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { useTheme, spacing, radius } from '../lib/theme';
import { Analytics, Aggregates, TrackedEvent, useScreenTracking } from '../lib/analytics';

const EVENT_LABELS: Record<string, string> = {
  app_open: 'Opened the app',
  session_end: 'Ended a session',
  screen_view: 'Visited a screen',
  onboarding_completed: 'Completed onboarding',
  mood_logged: 'Logged a mood',
  journal_created: 'Wrote a journal entry',
  journal_deleted: 'Deleted a journal entry',
  checkin_completed: 'Daily check-in',
  chat_message_sent: 'Talked to Coco',
  chat_message_received: 'Coco replied',
  breathing_started: 'Started breathing',
  breathing_ended: 'Finished breathing',
  meditation_started: 'Started meditation',
  meditation_ended: 'Finished meditation',
  sound_started: 'Played a sleep sound',
  sound_stopped: 'Stopped a sleep sound',
  grounding_started: 'Started grounding',
  grounding_completed: 'Finished grounding',
  sos_opened: 'Opened SOS',
  hotline_called: 'Called a hotline',
  booking_created: 'Booked a session',
  booking_cancelled: 'Cancelled a booking',
  auth_success: 'Signed in',
  auth_failed: 'Sign-in failed',
  profile_updated: 'Updated profile',
  insights_viewed: 'Viewed your insights',
};

const SCREEN_LABELS: Record<string, string> = {
  home: 'Home',
  tools: 'Tools',
  connect: 'Connect',
  profile: 'You',
  chat: 'Coco chat',
  breathe: 'Breathe',
  mood: 'Mood',
  journal: 'Journal',
  'journal/new': 'New journal',
  meditate: 'Meditate',
  sleep: 'Sleep',
  checkin: 'Check-in',
  grounding: 'Grounding',
  sos: 'SOS',
  places: 'Places',
  therapists: 'Therapists',
  bookings: 'Bookings',
  'booking/[therapistId]': 'Booking flow',
  'voice-therapy': 'Voice therapy',
  blog: 'Articles',
  community: 'Community',
  'community/circle': 'Circle',
  'community/guidelines': 'Circle agreement',
  'community/moderate': 'Moderation',
  about: 'About',
  onboarding: 'Onboarding',
  'auth/sign-in': 'Sign in',
  'auth/profile-edit': 'Profile edit',
  activity: 'Your activity',
  insights: 'Insights',
};

export default function Activity() {
  useScreenTracking('activity');
  const { colors } = useTheme();
  const [agg, setAgg] = useState<Aggregates | null>(null);
  const [events, setEvents] = useState<TrackedEvent[]>([]);

  const load = useCallback(async () => {
    const [a, e] = await Promise.all([Analytics.getAggregates(), Analytics.listEvents()]);
    setAgg(a);
    setEvents(e);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalActiveMin = agg ? Math.round(agg.totalActiveMs / 60000) : 0;
  const totalSessions = agg?.appOpens ?? 0;
  const totalEvents = agg?.totalEvents ?? 0;

  // Top screens by time
  const topScreens = agg
    ? Object.entries(agg.byScreen)
        .map(([route, s]) => ({ route, ...s }))
        .sort((a, b) => b.totalMs - a.totalMs)
        .slice(0, 8)
    : [];
  const maxScreenMs = topScreens.length > 0 ? Math.max(...topScreens.map((s) => s.totalMs)) : 1;

  // Top actions
  const topEvents = agg
    ? Object.entries(agg.byEvent)
        .filter(([k]) => k !== 'screen_view')
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    : [];

  const recent = events.slice(0, 30);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Your activity</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}>
        <Text variant="display">Your activity.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          Local-first. Synced with your account when you're signed in. Nothing here is shared.
        </Text>

        {/* Stat cards */}
        <View style={[styles.statRow, { marginTop: spacing.xl }]}>
          <StatTile label="Total time" value={fmtMin(totalActiveMin)} colors={colors} icon="time-outline" />
          <StatTile label="Sessions" value={String(totalSessions)} colors={colors} icon="apps-outline" />
          <StatTile label="Actions" value={String(totalEvents)} colors={colors} icon="flash-outline" />
        </View>

        {agg?.firstSeenAt ? (
          <Card tone="muted" style={{ marginTop: spacing.lg }}>
            <Text variant="caption" tone="dim">Started using Coco</Text>
            <Text variant="bodyMedium" style={{ marginTop: 2 }}>
              {new Date(agg.firstSeenAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </Card>
        ) : null}

        {/* Top screens */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="subtitle">Where you spend time</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Top features by time spent.
          </Text>
          <Card style={{ padding: spacing.lg }}>
            {topScreens.length === 0 ? (
              <Text variant="caption" tone="dim">Nothing recorded yet — use a feature to see it here.</Text>
            ) : (
              topScreens.map((s, i) => (
                <View key={s.route} style={{ marginTop: i === 0 ? 0 : spacing.md }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="bodyMedium">{SCREEN_LABELS[s.route] ?? s.route}</Text>
                    <Text variant="caption" tone="dim">{fmtMs(s.totalMs)} · {s.views} {s.views === 1 ? 'visit' : 'visits'}</Text>
                  </View>
                  <View style={[styles.bar, { backgroundColor: colors.surfaceMuted, marginTop: 6 }]}>
                    <View style={{
                      width: `${Math.min(100, (s.totalMs / maxScreenMs) * 100)}%`,
                      height: '100%',
                      backgroundColor: colors.primary,
                      borderRadius: 3,
                    }} />
                  </View>
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Top actions */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="subtitle">What you do most</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Actions, not screen visits.
          </Text>
          <Card style={{ padding: 0 }}>
            {topEvents.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <Text variant="caption" tone="dim">Nothing yet. Log a mood or talk to Coco to see this fill in.</Text>
              </View>
            ) : (
              topEvents.map((e, i) => (
                <View key={e.name}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
                    <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                    <Text variant="bodyMedium" style={{ flex: 1, marginLeft: spacing.md }}>
                      {EVENT_LABELS[e.name] ?? e.name}
                    </Text>
                    <Text variant="bodyMedium" tone="primary" style={{ fontWeight: '700' }}>×{e.count}</Text>
                  </View>
                  {i < topEvents.length - 1 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg }} /> : null}
                </View>
              ))
            )}
          </Card>
        </View>

        {/* Recent feed */}
        <View style={{ marginTop: spacing.xl }}>
          <Text variant="subtitle">Recent</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: 2, marginBottom: spacing.md }}>
            Your last {recent.length} actions.
          </Text>
          <Card style={{ padding: 0 }}>
            {recent.length === 0 ? (
              <View style={{ padding: spacing.lg }}>
                <Text variant="caption" tone="dim">Nothing yet.</Text>
              </View>
            ) : (
              recent.map((ev, i) => (
                <View key={ev.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">{describe(ev)}</Text>
                      <Text variant="caption" tone="dim">{relTime(ev.at)}</Text>
                    </View>
                    {ev.props.durationMs ? (
                      <Text variant="caption" tone="dim">{fmtMs(Number(ev.props.durationMs))}</Text>
                    ) : null}
                  </View>
                  {i < recent.length - 1 ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.lg }} /> : null}
                </View>
              ))
            )}
          </Card>
        </View>

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            We don't log content — only event names, durations, and lengths. Erasing your data from Profile clears everything here too.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatTile({ label, value, colors, icon }: { label: string; value: string; colors: ReturnType<typeof useTheme>['colors']; icon: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text variant="title" style={{ marginTop: 6 }}>{value}</Text>
      <Text variant="caption" tone="dim" style={{ marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function describe(ev: TrackedEvent): string {
  if (ev.name === 'screen_view') {
    const route = String(ev.props.route ?? 'unknown');
    return `Visited ${SCREEN_LABELS[route] ?? route}`;
  }
  return EVENT_LABELS[ev.name] ?? ev.name.replace(/_/g, ' ');
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r === 0 ? `${m}m` : `${m}m ${r}s`;
  const h = Math.floor(m / 60);
  const mr = m % 60;
  return mr === 0 ? `${h}h` : `${h}h ${mr}m`;
}

function fmtMin(min: number): string {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return r === 0 ? `${h}h` : `${h}h ${r}m`;
}

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
