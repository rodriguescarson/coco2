// Smart in-app review prompt.
//
// Asks the OS to show its native "rate this app" sheet, but only at a calm,
// positive moment and only rarely. This is a mental-health app, so the prompt
// must never ride on the back of a low-mood check-in or a crisis interaction —
// callers are responsible for placing maybeAskForReview() at a genuinely
// positive beat (e.g. finishing a breathing exercise). This module's job is the
// throttling: even a well-placed call no-ops unless every gate below passes.
//
// Gates (all must hold):
//   (a) first launch was >= 3 days ago        — give people time to form an opinion
//   (b) >= 2 positive events have occurred     — they've gotten value, not just opened the app
//   (c) we haven't already asked on this app version
//   (d) we haven't asked in the last 120 days
//
// Every call also counts as one positive event (gate b's counter), so a single
// wired call site naturally accrues toward the threshold across sessions.
//
// Storage matches the rest of the app: AsyncStorage under the @coco/ namespace.
// Never throws — review prompting is strictly best-effort.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';

const KEYS = {
  firstLaunchAt: '@coco/review-first-launch-at',
  positiveEvents: '@coco/review-positive-events',
  promptedVersion: '@coco/review-prompted-version',
  lastPromptAt: '@coco/review-last-prompt-at',
} as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_AGE_MS = 3 * DAY_MS; // (a) account must be >= 3 days old
const MIN_POSITIVE_EVENTS = 2; // (b) at least ~2 positive moments
const MIN_INTERVAL_MS = 120 * DAY_MS; // (d) at most once per 120 days

function appVersion(): string {
  // expo-constants is already a dependency; covers managed + bare builds.
  return (
    Constants.expoConfig?.version ??
    (Constants as { nativeAppVersion?: string }).nativeAppVersion ??
    'unknown'
  );
}

async function readNumber(key: string): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Call once at a positive, non-fragile moment. Records the positive event and,
 * if every throttle gate passes, asks the OS to present its native review sheet.
 * Safe to call often; it self-throttles and never throws.
 */
export async function maybeAskForReview(): Promise<void> {
  try {
    const now = Date.now();

    // Seed first-launch timestamp on the very first call.
    let firstLaunchAt = await readNumber(KEYS.firstLaunchAt);
    if (firstLaunchAt == null) {
      firstLaunchAt = now;
      await AsyncStorage.setItem(KEYS.firstLaunchAt, String(now));
    }

    // Count this positive event (gate b's counter).
    const positiveEvents = (await readNumber(KEYS.positiveEvents)) ?? 0;
    const nextCount = positiveEvents + 1;
    await AsyncStorage.setItem(KEYS.positiveEvents, String(nextCount));

    // Native sheet must actually be available (false in Expo Go / simulators
    // without a store, and on web).
    if (!(await StoreReview.isAvailableAsync())) return;

    // (a) account old enough
    if (now - firstLaunchAt < MIN_AGE_MS) return;

    // (b) enough positive moments
    if (nextCount < MIN_POSITIVE_EVENTS) return;

    // (c) not already asked on this version
    const promptedVersion = await AsyncStorage.getItem(KEYS.promptedVersion);
    if (promptedVersion === appVersion()) return;

    // (d) not asked within the cooldown window
    const lastPromptAt = await readNumber(KEYS.lastPromptAt);
    if (lastPromptAt != null && now - lastPromptAt < MIN_INTERVAL_MS) return;

    // All gates passed — ask, then record so we don't ask again soon.
    await StoreReview.requestReview();
    await AsyncStorage.multiSet([
      [KEYS.promptedVersion, appVersion()],
      [KEYS.lastPromptAt, String(now)],
    ]);
  } catch {
    // Best-effort only; never disrupt the user's flow.
  }
}
