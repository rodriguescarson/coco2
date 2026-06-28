// Pure, deterministic analysis of a person's own mood history. No AI, no network,
// no new dependencies — it just reads the mood log they already keep and surfaces
// gentle, non-clinical patterns: a trend, what tends to lift them, what tends to
// weigh on them, and the rhythm of their days. The more they log, the more this
// has to say — a moat that belongs to the user, not to us.
//
// Everything here is framed as observation, never diagnosis. Copy that renders
// these numbers lives in the Insights screen and is kept soft on purpose.

import type { MoodEntry } from './storage';

export const DAY_MS = 24 * 60 * 60 * 1000;

// How much a tag's average must differ from the baseline before we'd mention it,
// and how many entries must carry that tag before we trust it. Tuned to avoid
// over-reading a single rough day.
const TAG_MIN_COUNT = 3;
const TAG_MIN_DELTA = 0.25;
const DAY_MIN_COUNT = 2;

export type WeekPoint = { weekStart: number; avg: number; count: number };

export type MoodTrend = {
  count: number; // entries inside the window
  avg: number | null; // mean mood (1–5) inside the window
  prevAvg: number | null; // mean mood in the window immediately before this one
  direction: 'up' | 'down' | 'steady' | null;
  delta: number | null; // avg − prevAvg
  weekly: WeekPoint[]; // oldest → newest, for a small sparkline
};

export type TagInsight = {
  tag: string;
  avg: number; // mean mood on entries carrying this tag
  count: number;
  delta: number; // avg − baseline (positive = lifts, negative = weighs)
};

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export type DayPoint = { day: number; avg: number; count: number }; // day: 0 = Sun

export type Insights = {
  windowDays: number;
  total: number; // all-time mood entries (used for empty / onboarding states)
  baseline: number | null; // mean mood across the window
  trend: MoodTrend;
  lifts: TagInsight[]; // tags meaningfully above baseline, strongest first
  weighs: TagInsight[]; // tags meaningfully below baseline, heaviest first
  brightestDay: DayPoint | null; // weekday with the highest average
  partsOfDay: { part: PartOfDay; avg: number; count: number }[]; // present parts, brightest first
};

function mean(nums: number[]): number | null {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function partOfDay(at: number): PartOfDay {
  const h = new Date(at).getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}

export const PART_LABEL: Record<PartOfDay, string> = {
  morning: 'mornings',
  afternoon: 'afternoons',
  evening: 'evenings',
  night: 'late nights',
};

export const WEEKDAY_LABEL = ['Sundays', 'Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays', 'Saturdays'];

function buildTrend(windowMoods: MoodEntry[], prevMoods: MoodEntry[], windowDays: number, now: number): MoodTrend {
  const avg = mean(windowMoods.map((m) => m.score));
  const prevAvg = mean(prevMoods.map((m) => m.score));

  let direction: MoodTrend['direction'] = null;
  let delta: number | null = null;
  if (avg !== null && prevAvg !== null) {
    delta = round1(avg - prevAvg);
    direction = delta >= 0.2 ? 'up' : delta <= -0.2 ? 'down' : 'steady';
  }

  // Bucket the window into 7-day weeks for a small sparkline. Oldest first.
  const weeks = Math.max(1, Math.ceil(windowDays / 7));
  const start = now - windowDays * DAY_MS;
  const buckets: MoodEntry[][] = Array.from({ length: weeks }, () => []);
  for (const m of windowMoods) {
    let idx = Math.floor((m.at - start) / (7 * DAY_MS));
    if (idx < 0) idx = 0;
    if (idx >= weeks) idx = weeks - 1;
    buckets[idx].push(m);
  }
  const weekly: WeekPoint[] = buckets.map((b, i) => {
    const a = mean(b.map((m) => m.score));
    return { weekStart: start + i * 7 * DAY_MS, avg: a === null ? 0 : round1(a), count: b.length };
  });

  return {
    count: windowMoods.length,
    avg: avg === null ? null : round1(avg),
    prevAvg: prevAvg === null ? null : round1(prevAvg),
    direction,
    delta,
    weekly,
  };
}

function buildTagInsights(windowMoods: MoodEntry[], baseline: number): { lifts: TagInsight[]; weighs: TagInsight[] } {
  const byTag = new Map<string, number[]>();
  for (const m of windowMoods) {
    for (const t of m.tags ?? []) {
      const arr = byTag.get(t) ?? [];
      arr.push(m.score);
      byTag.set(t, arr);
    }
  }

  const all: TagInsight[] = [];
  for (const [tag, scores] of byTag) {
    if (scores.length < TAG_MIN_COUNT) continue;
    const avg = mean(scores)!;
    const delta = round1(avg - baseline);
    if (Math.abs(delta) < TAG_MIN_DELTA) continue;
    all.push({ tag, avg: round1(avg), count: scores.length, delta });
  }

  const lifts = all
    .filter((t) => t.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 4);
  const weighs = all
    .filter((t) => t.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 4);
  return { lifts, weighs };
}

/**
 * Analyse the user's mood log over the last `windowDays`. `moods` may be in any
 * order; only `score`, `tags`, and `at` are used. Returns a fully-formed
 * `Insights` even when sparse — callers decide what is meaningful enough to show.
 */
export function computeInsights(moods: MoodEntry[], windowDays = 30, now = Date.now()): Insights {
  const start = now - windowDays * DAY_MS;
  const prevStart = start - windowDays * DAY_MS;

  const windowMoods = moods.filter((m) => m.at >= start && m.at <= now);
  const prevMoods = moods.filter((m) => m.at >= prevStart && m.at < start);

  const baseline = mean(windowMoods.map((m) => m.score));
  const trend = buildTrend(windowMoods, prevMoods, windowDays, now);

  const { lifts, weighs } = baseline === null
    ? { lifts: [], weighs: [] }
    : buildTagInsights(windowMoods, baseline);

  // Brightest weekday.
  const byDay = new Map<number, number[]>();
  for (const m of windowMoods) {
    const d = new Date(m.at).getDay();
    const arr = byDay.get(d) ?? [];
    arr.push(m.score);
    byDay.set(d, arr);
  }
  let brightestDay: DayPoint | null = null;
  for (const [day, scores] of byDay) {
    if (scores.length < DAY_MIN_COUNT) continue;
    const avg = round1(mean(scores)!);
    if (!brightestDay || avg > brightestDay.avg) brightestDay = { day, avg, count: scores.length };
  }

  // Parts of day, brightest first.
  const byPart = new Map<PartOfDay, number[]>();
  for (const m of windowMoods) {
    const p = partOfDay(m.at);
    const arr = byPart.get(p) ?? [];
    arr.push(m.score);
    byPart.set(p, arr);
  }
  const partsOfDay = [...byPart.entries()]
    .map(([part, scores]) => ({ part, avg: round1(mean(scores)!), count: scores.length }))
    .sort((a, b) => b.avg - a.avg);

  return {
    windowDays,
    total: moods.length,
    baseline: baseline === null ? null : round1(baseline),
    trend,
    lifts,
    weighs,
    brightestDay,
    partsOfDay,
  };
}

export const MOOD_WORDS = ['', 'awful', 'low', 'okay', 'good', 'great'];

// A label for a 1–5 average, e.g. 3.6 → "okay–good".
export function scoreWord(avg: number): string {
  const lo = Math.max(1, Math.floor(avg));
  const hi = Math.min(5, Math.ceil(avg));
  if (lo === hi) return MOOD_WORDS[lo];
  return `${MOOD_WORDS[lo]}–${MOOD_WORDS[hi]}`;
}

/**
 * One gentle, non-clinical headline summarising the window. Always returns
 * something kind, even with little data. Never alarming, never diagnostic.
 */
export function reflection(ins: Insights): string {
  const { trend } = ins;
  if (trend.count === 0) {
    return 'Once you log a few moods, a gentle picture of your weeks shows up here.';
  }
  if (trend.count < 4) {
    return 'A quiet start. A handful more check-ins and the patterns begin to surface.';
  }

  if (trend.direction === 'up') {
    return 'These last weeks have been trending a little brighter than the ones before. Worth noticing what helped.';
  }
  if (trend.direction === 'down') {
    return 'These last weeks have felt a bit heavier than before. That happens — be gentle with yourself, and lean on what tends to lift you.';
  }
  if (ins.brightestDay) {
    return `Fairly steady lately. ${WEEKDAY_LABEL[ins.brightestDay.day]} have tended to be your lighter days.`;
  }
  return 'Fairly steady lately. Keep checking in — the small notes add up.';
}
