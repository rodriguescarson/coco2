import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  user: '@coco/user',
  mood: '@coco/mood-log',
  journal: '@coco/journal',
  checkin: '@coco/checkin-log',
  chat: '@coco/chat-history',
  prefs: '@coco/prefs',
  onboarded: '@coco/onboarded',
} as const;

export type MoodEntry = {
  id: string;
  score: 1 | 2 | 3 | 4 | 5;
  note?: string;
  tags?: string[];
  at: number;
};

export type JournalEntry = {
  id: string;
  title?: string;
  body: string;
  prompt?: string;
  at: number;
};

export type CheckinEntry = {
  date: string; // YYYY-MM-DD
  at: number;
  prompts: { feeling: string; gratitude?: string };
};

export type UserProfile = {
  name?: string;
  pronouns?: string;
  goals?: string[];
};

export type Prefs = {
  reduceMotion?: boolean;
  hapticsOn?: boolean;
  reminders?: boolean;
};

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

export const Storage = {
  async getUser(): Promise<UserProfile> {
    return readJson(KEYS.user, {});
  },
  async setUser(u: UserProfile) {
    return writeJson(KEYS.user, u);
  },
  async getOnboarded(): Promise<boolean> {
    const v = await AsyncStorage.getItem(KEYS.onboarded);
    return v === '1';
  },
  async setOnboarded(b: boolean) {
    await AsyncStorage.setItem(KEYS.onboarded, b ? '1' : '0');
  },

  async listMood(): Promise<MoodEntry[]> {
    return readJson(KEYS.mood, []);
  },
  async addMood(e: MoodEntry) {
    const list = await Storage.listMood();
    list.unshift(e);
    await writeJson(KEYS.mood, list.slice(0, 365));
  },

  async listJournal(): Promise<JournalEntry[]> {
    return readJson(KEYS.journal, []);
  },
  async addJournal(e: JournalEntry) {
    const list = await Storage.listJournal();
    list.unshift(e);
    await writeJson(KEYS.journal, list);
  },
  async deleteJournal(id: string) {
    const list = (await Storage.listJournal()).filter((j) => j.id !== id);
    await writeJson(KEYS.journal, list);
  },

  async listCheckin(): Promise<CheckinEntry[]> {
    return readJson(KEYS.checkin, []);
  },
  async addCheckin(e: CheckinEntry) {
    const list = await Storage.listCheckin();
    const existing = list.findIndex((c) => c.date === e.date);
    if (existing >= 0) list[existing] = e;
    else list.unshift(e);
    await writeJson(KEYS.checkin, list);
  },

  async getPrefs(): Promise<Prefs> {
    return readJson(KEYS.prefs, { hapticsOn: true, reminders: true });
  },
  async setPrefs(p: Prefs) {
    return writeJson(KEYS.prefs, p);
  },

  async getChat(): Promise<{ id: string; role: 'user' | 'assistant'; text: string; at: number }[]> {
    return readJson(KEYS.chat, []);
  },
  async setChat(msgs: { id: string; role: 'user' | 'assistant'; text: string; at: number }[]) {
    return writeJson(KEYS.chat, msgs.slice(-200));
  },

  async clearAll() {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  },
};

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function streakFromCheckins(entries: CheckinEntry[]): number {
  if (!entries.length) return 0;
  const set = new Set(entries.map((e) => e.date));
  let streak = 0;
  const cursor = new Date();
  while (set.has(todayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
