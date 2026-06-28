// Privacy-first analytics. Every event lands in AsyncStorage and (best-effort)
// mirrors to Firestore under users/{uid}/events. We also keep a rolling
// aggregate at users/{uid}/stats so the Profile page can show the user a
// dashboard without scanning thousands of rows.
//
// What's intentionally NOT tracked here:
// - Journal text content (only length)
// - Chat message content (only length + role + crisis flag)
// - Mood notes
// Anything that could be sensitive content stays local-only.

import { useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureFirebase, doc, setDoc, collection, serverTimestamp, writeBatch } from './firebase';

export type EventName =
  | 'app_open'
  | 'session_end'
  | 'screen_view'
  | 'onboarding_completed'
  | 'mood_logged'
  | 'journal_created'
  | 'journal_deleted'
  | 'checkin_completed'
  | 'chat_message_sent'
  | 'chat_message_received'
  | 'voice_recording_started'
  | 'voice_journal_saved'
  | 'voice_to_chat'
  | 'voice_transcribe_failed'
  | 'community_guidelines_accepted'
  | 'community_post_created'
  | 'community_post_moderated'
  | 'community_post_reported'
  | 'community_author_blocked'
  | 'breathing_started'
  | 'breathing_ended'
  | 'meditation_started'
  | 'meditation_ended'
  | 'sound_started'
  | 'sound_stopped'
  | 'grounding_started'
  | 'grounding_completed'
  | 'sos_opened'
  | 'hotline_called'
  | 'hotline_texted'
  | 'booking_created'
  | 'booking_cancelled'
  | 'auth_success'
  | 'auth_failed'
  | 'profile_updated'
  | 'streak_shared'
  | 'invite_shared'
  | 'referral_claimed';

export type TrackedEvent = {
  id: string;
  name: EventName;
  at: number;
  props: Record<string, unknown>;
};

export type Aggregates = {
  totalEvents: number;
  totalActiveMs: number;
  appOpens: number;
  byEvent: Record<string, number>;
  byScreen: Record<string, { views: number; totalMs: number }>;
  firstSeenAt: number;
  lastSeenAt: number;
};

const KEY_EVENTS = '@coco/analytics-events';
const KEY_AGG = '@coco/analytics-agg';
const MAX_LOCAL_EVENTS = 1000;
const FLUSH_BATCH_SIZE = 25;

const emptyAgg = (): Aggregates => ({
  totalEvents: 0,
  totalActiveMs: 0,
  appOpens: 0,
  byEvent: {},
  byScreen: {},
  firstSeenAt: 0,
  lastSeenAt: 0,
});

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

const queue: TrackedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const timers = new Map<string, number>();

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function pushAggregate(e: TrackedEvent): Promise<void> {
  const agg = await readJson<Aggregates>(KEY_AGG, emptyAgg());
  agg.totalEvents += 1;
  agg.byEvent[e.name] = (agg.byEvent[e.name] || 0) + 1;
  if (e.name === 'app_open') agg.appOpens += 1;
  if (!agg.firstSeenAt) agg.firstSeenAt = e.at;
  agg.lastSeenAt = e.at;

  if (e.name === 'screen_view') {
    const route = String((e.props as { route?: string }).route ?? 'unknown');
    const ms = Number((e.props as { durationMs?: number }).durationMs ?? 0);
    const cur = agg.byScreen[route] ?? { views: 0, totalMs: 0 };
    cur.views += 1;
    cur.totalMs += Math.max(0, ms);
    agg.byScreen[route] = cur;
    agg.totalActiveMs += Math.max(0, ms);
  }

  await writeJson(KEY_AGG, agg);
  void mirrorAggregate(agg);
}

async function mirrorAggregate(agg: Aggregates): Promise<void> {
  const fb = ensureFirebase();
  const uid = fb?.auth.currentUser?.uid;
  if (!fb || !uid) return;
  try {
    await setDoc(
      doc(fb.db, 'users', uid, 'stats', 'aggregate'),
      { ...agg, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // best-effort
  }
}

async function appendLocal(e: TrackedEvent): Promise<void> {
  const list = await readJson<TrackedEvent[]>(KEY_EVENTS, []);
  list.unshift(e);
  await writeJson(KEY_EVENTS, list.slice(0, MAX_LOCAL_EVENTS));
}

function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    if (queue.length === 0) return;
    const batchEvents = queue.splice(0, FLUSH_BATCH_SIZE);
    const fb = ensureFirebase();
    const uid = fb?.auth.currentUser?.uid;
    if (!fb || !uid) return;
    try {
      const batch = writeBatch(fb.db);
      batchEvents.forEach((e) => {
        batch.set(doc(fb.db, 'users', uid, 'events', e.id), { ...e });
      });
      await batch.commit();
    } catch {
      // re-queue silently; will retry on next flush
      queue.push(...batchEvents);
    }
  }, 1500);
}

export const Analytics = {
  async track(name: EventName, props: Record<string, unknown> = {}): Promise<void> {
    const e: TrackedEvent = { id: newId(), name, at: Date.now(), props };
    await appendLocal(e);
    queue.push(e);
    void pushAggregate(e);
    scheduleFlush();
  },

  // Start a named timer; returns a stop() that records the elapsed ms with an event.
  startTimer(key: string): () => number {
    const t0 = Date.now();
    timers.set(key, t0);
    return () => {
      const start = timers.get(key) ?? t0;
      timers.delete(key);
      return Date.now() - start;
    };
  },

  // Convenience: time a callback
  async timed<T>(name: EventName, props: Record<string, unknown>, fn: () => Promise<T> | T): Promise<T> {
    const t0 = Date.now();
    const result = await fn();
    void Analytics.track(name, { ...props, durationMs: Date.now() - t0 });
    return result;
  },

  async listEvents(): Promise<TrackedEvent[]> {
    return readJson(KEY_EVENTS, []);
  },

  async getAggregates(): Promise<Aggregates> {
    return readJson(KEY_AGG, emptyAgg());
  },

  async clear(): Promise<void> {
    await AsyncStorage.multiRemove([KEY_EVENTS, KEY_AGG]);
  },
};

// Hook screens use to log a screen_view with duration on blur.
export function useScreenTracking(route: string): void {
  const startedRef = useRef<number | null>(null);
  useFocusEffect(
    useCallback(() => {
      startedRef.current = Date.now();
      return () => {
        const start = startedRef.current;
        startedRef.current = null;
        if (!start) return;
        const ms = Date.now() - start;
        if (ms < 250) return; // don't record drive-by glances
        void Analytics.track('screen_view', { route, durationMs: ms });
      };
    }, [route]),
  );
}

// Fired once when the app boots.
export function useAppOpen(): void {
  useEffect(() => {
    void Analytics.track('app_open', { ts: Date.now() });
  }, []);
}
