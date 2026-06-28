// Gentle, opt-in local + remote notifications for Coco.
//
// SENSITIVITY — this is a mental-health app. The rules below are non-negotiable:
//   1. OPT-IN. Notifications are OFF by default. We never schedule anything
//      until the user explicitly turns reminders on. We ask for the OS
//      permission only at that moment, never on a cold start.
//   2. GENTLE. Copy is an invitation, never a command or a guilt-trip. No
//      streak-shaming ("you broke your streak!"), no urgency, no nagging.
//   3. QUIET HOURS. We never let a reminder land during the user's quiet
//      window (default 22:00–07:00). If their chosen time falls inside it we
//      simply don't schedule and tell them why.
//   4. NO SENSITIVE DATA. A notification never contains mood, journal,
//      check-in, chat, or crisis content — only a soft, generic nudge.
//   5. NEVER AROUND CRISIS. Nothing here is ever triggered by the SOS / crisis
//      flow. `pauseRemindersForToday()` lets the crisis screen quietly stand
//      our daily nudge down so a person in distress is not pinged.
//
// Everything degrades gracefully: if permission is denied, Firebase is absent,
// or we are in Expo Go (where iOS strips push tokens), we no-op without
// throwing. The local daily reminder is the primary feature; remote push is a
// minimal best-effort extra.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  ensureFirebase,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from './firebase';

const isExpoGo = Constants.appOwnership === 'expo';

// A stable tag so we only ever own (and clear) our own scheduled reminder, and
// never touch any other notification the OS might be holding.
const REMINDER_TAG = 'coco-daily-checkin';
const ANDROID_CHANNEL_ID = 'gentle-reminders';

const SETTINGS_KEY = '@coco/notif-settings';
// When a crisis/SOS moment happens we stand the reminder down for the rest of
// the day. This stores the YYYY-MM-DD we paused for.
const PAUSE_KEY = '@coco/notif-paused-day';

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';

export type NotificationSettings = {
  /** Master opt-in. OFF by default — the user must turn it on. */
  enabled: boolean;
  /** Daily reminder time, 24h. Calm default of 09:00 once enabled. */
  reminderHour: number; // 0–23
  reminderMinute: number; // 0–59
  /** Quiet window during which a reminder must never fire. On by default. */
  quietHoursEnabled: boolean;
  quietStartHour: number; // 0–23, inclusive
  quietEndHour: number; // 0–23, exclusive
};

export const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: false,
  reminderHour: 9,
  reminderMinute: 0,
  quietHoursEnabled: true,
  quietStartHour: 22,
  quietEndHour: 7,
};

// A small rotation of soft, non-prescriptive lines. None reference streaks,
// progress, or anything the user "should" do. Picked at schedule time.
const GENTLE_TITLES = ['A moment for you?', 'Coco is here', 'A gentle pause'];
const GENTLE_BODIES = [
  'Whenever you’re ready, a slow breath or a quiet check-in is here for you.',
  'No pressure — just a soft moment if you’d like one.',
  'How are you, really? Coco’s here whenever it helps.',
  'A little space to breathe, if now feels right.',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// expo-notifications can be missing its native side in some sandboxes; guard so
// a misconfigured environment never crashes the app.
let handlerSet = false;
export function configureNotificationHandler(): void {
  if (handlerSet) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        // Keep it calm: no sound or badge for a gentle wellbeing nudge.
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    handlerSet = true;
  } catch {
    // no-op
  }
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: 'Gentle reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: false,
      vibrationPattern: undefined,
      lightColor: '#0E8A5F', // Coco calm green
      showBadge: false,
    });
  } catch {
    // no-op
  }
}

// ---- Settings persistence -------------------------------------------------

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<NotificationSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setNotificationSettings(
  next: NotificationSettings,
): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch {
    // best-effort
  }
  // Mirror the preference (NOT any content) to Firestore so the choice follows
  // the user across devices. Never blocks and never throws.
  void mirrorSettingsToCloud(next);
}

async function mirrorSettingsToCloud(next: NotificationSettings): Promise<void> {
  const fb = ensureFirebase();
  const uid = fb?.auth.currentUser?.uid;
  if (!fb || !uid) return;
  try {
    await setDoc(
      doc(fb.db, 'users', uid),
      { notificationSettings: next, notificationSettingsUpdatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch {
    // offline / not permitted — fine, AsyncStorage is the source of truth.
  }
}

// ---- Quiet hours ----------------------------------------------------------

/** True if `hour` (0–23) falls inside the quiet window. Handles wrap-around
 * windows like 22:00 → 07:00. */
export function isWithinQuietHours(hour: number, s: NotificationSettings): boolean {
  if (!s.quietHoursEnabled) return false;
  const { quietStartHour: start, quietEndHour: end } = s;
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end; // same-day window
  return hour >= start || hour < end; // wraps past midnight
}

// ---- Permissions + token registration -------------------------------------

/**
 * Ask for notification permission. Called ONLY from an explicit user action
 * (turning reminders on) — never automatically. Returns true if granted.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (current.status === 'denied' && !current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

/**
 * Register this device's Expo push token under
 * `users/{uid}/pushTokens/{token}` (guarded by the existing per-user Firestore
 * rule). Best-effort and safe to call repeatedly. Skips silently in Expo Go on
 * iOS (no push tokens there) and whenever permission isn't granted.
 */
export async function registerPushToken(): Promise<string | null> {
  if (isExpoGo && Platform.OS === 'ios') return null;
  try {
    if (!(await hasNotificationPermission())) return null;
    await ensureAndroidChannel();

    const projectId =
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      (Constants.easConfig?.projectId as string | undefined);

    const result = projectId
      ? await Notifications.getExpoPushTokenAsync({ projectId })
      : await Notifications.getExpoPushTokenAsync();
    const token = result.data;
    if (!token) return null;

    const fb = ensureFirebase();
    const uid = fb?.auth.currentUser?.uid;
    if (fb && uid) {
      await setDoc(
        doc(fb.db, 'users', uid, 'pushTokens', token),
        { token, platform: Platform.OS, lastSeenAt: serverTimestamp() },
        { merge: true },
      ).catch(() => {});
    }
    return token;
  } catch (err) {
    console.warn('[notif] token registration failed', err);
    return null;
  }
}

// ---- Local daily reminder --------------------------------------------------

/** Cancel only Coco's own daily reminder; never touches other notifications. */
export async function cancelDailyReminder(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => (n.content.data as { tag?: string } | null)?.tag === REMINDER_TAG)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  } catch {
    // no-op
  }
}

function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/**
 * Reconcile the scheduled daily reminder against the current settings. Always
 * clears our prior schedule first so we never stack duplicates. Returns a
 * status the settings screen can surface to the user.
 */
export async function syncDailyReminder(): Promise<
  'scheduled' | 'off' | 'no-permission' | 'quiet-conflict' | 'paused'
> {
  await cancelDailyReminder();

  const settings = await getNotificationSettings();
  if (!settings.enabled) return 'off';
  if (!(await hasNotificationPermission())) return 'no-permission';

  // A reminder must never be scheduled to fire inside the quiet window.
  if (isWithinQuietHours(settings.reminderHour, settings)) return 'quiet-conflict';

  // If a crisis moment paused us today, respect it (the next day's settings
  // sync re-enables normally).
  try {
    const pausedDay = await AsyncStorage.getItem(PAUSE_KEY);
    if (pausedDay === todayKey()) return 'paused';
  } catch {
    // ignore
  }

  try {
    await ensureAndroidChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: pick(GENTLE_TITLES),
        body: pick(GENTLE_BODIES),
        data: { tag: REMINDER_TAG },
        ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
      },
    });
    return 'scheduled';
  } catch (err) {
    console.warn('[notif] schedule failed', err);
    return 'off';
  }
}

/**
 * Stand the daily reminder down for the rest of today. Intended to be called
 * when the crisis/SOS screen opens, so a person in distress is not nudged. The
 * normal schedule resumes tomorrow (or the next time settings are synced after
 * the paused day rolls over).
 */
export async function pauseRemindersForToday(): Promise<void> {
  try {
    await AsyncStorage.setItem(PAUSE_KEY, todayKey());
  } catch {
    // ignore
  }
  await cancelDailyReminder();
}

// ---- Remote push (client-side, best-effort) --------------------------------

/**
 * Send an Expo push to another user by uid, by reading their registered tokens
 * from `users/{uid}/pushTokens` and POSTing to Expo's push API directly.
 *
 * INTEGRITY TRADEOFF: with no Cloud Functions backend, this runs from the
 * client, so the sender's device technically composes the title/body. That is
 * acceptable ONLY for low-stakes, non-sensitive nudges (e.g. "your buddy
 * checked in"). NEVER pass mood, journal, check-in, chat, or any crisis
 * content here — those must never leave the device in a notification. If
 * stronger guarantees are ever needed, move this behind a trusted server that
 * authenticates the caller (see Amorelle's push-send edge function).
 */
export async function sendExpoPush(
  toUid: string,
  payload: { title: string; body: string; data?: Record<string, unknown> },
): Promise<{ ok: boolean; sent: number }> {
  const fb = ensureFirebase();
  if (!fb || !toUid) return { ok: false, sent: 0 };
  try {
    const snap = await getDocs(collection(fb.db, 'users', toUid, 'pushTokens'));
    const tokens = snap.docs
      .map((d) => (d.data() as { token?: string }).token)
      .filter((t): t is string => typeof t === 'string' && t.length > 0);
    if (tokens.length === 0) return { ok: true, sent: 0 };

    const messages = tokens.map((to) => ({
      to,
      title: String(payload.title).slice(0, 200),
      body: String(payload.body).slice(0, 1000),
      data: payload.data ?? {},
    }));

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    return { ok: res.ok, sent: tokens.length };
  } catch (err) {
    console.warn('[notif] sendExpoPush failed', err);
    return { ok: false, sent: 0 };
  }
}
