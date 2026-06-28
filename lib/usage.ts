import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from './storage';

// Local, per-day counter for free-tier AI listener messages. Pro users are
// unlimited; free users get FREE_DAILY_AI_MESSAGES per calendar day. Crisis
// messages are never counted or capped (handled by the caller) — support must
// always be reachable.
//
// This lives only on-device. It is a gentle nudge toward Pro, not a hard
// security boundary; the authoritative entitlement check is RevenueCat.

const KEY = '@coco/ai-usage';

export const FREE_DAILY_AI_MESSAGES = 15;

type Usage = { date: string; count: number };

async function read(): Promise<Usage> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { date: todayKey(), count: 0 };
    const v = JSON.parse(raw) as Usage;
    // Roll over at midnight: a new day resets the counter.
    if (v.date !== todayKey()) return { date: todayKey(), count: 0 };
    return v;
  } catch {
    return { date: todayKey(), count: 0 };
  }
}

/** How many free AI messages the user has sent today. */
export async function getDailyAiCount(): Promise<number> {
  return (await read()).count;
}

/** Remaining free AI messages today. */
export async function getDailyAiRemaining(): Promise<number> {
  return Math.max(0, FREE_DAILY_AI_MESSAGES - (await read()).count);
}

/** Increment today's free AI message count. Returns the new count. */
export async function incrementDailyAiCount(): Promise<number> {
  const current = await read();
  const next: Usage = { date: todayKey(), count: current.count + 1 };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // best-effort; a failed write just means the cap is lenient this turn
  }
  return next.count;
}
