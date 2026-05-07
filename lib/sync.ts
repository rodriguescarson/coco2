import {
  ensureFirebase,
  doc,
  setDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit,
  getDocs,
  writeBatch,
} from './firebase';
import { Storage, MoodEntry, JournalEntry, CheckinEntry, UserProfile } from './storage';
import type { ChatMessage } from './chat';

type Booking = {
  id: string;
  therapistId: string;
  therapistName: string;
  startsAt: number;
  modality: 'video' | 'in-person' | 'both';
  notes?: string;
  status: 'confirmed' | 'cancelled';
  createdAt: number;
};

function uid(): string | null {
  const fb = ensureFirebase();
  return fb?.auth.currentUser?.uid ?? null;
}

async function safeSetDoc(path: string[], data: Record<string, unknown>): Promise<void> {
  const fb = ensureFirebase();
  if (!fb) return;
  try {
    const ref = doc(fb.db, path[0], ...path.slice(1));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
  } catch {
    // Best-effort sync; local write is still authoritative.
  }
}

export const Sync = {
  async pushProfile(profile: UserProfile & { email?: string; phone?: string; gender?: string }) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'profile', 'main'], profile);
    await safeSetDoc(['users', u], {
      name: profile.name ?? null,
      goals: profile.goals ?? null,
      hasEmail: !!profile.email,
    });
  },

  async pushMood(e: MoodEntry) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'moods', e.id], { ...e });
  },

  async pushJournal(e: JournalEntry) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'journals', e.id], { ...e });
  },

  async pushCheckin(e: CheckinEntry) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'checkins', e.date], { ...e });
  },

  async pushChat(msg: ChatMessage) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'chats', msg.id], { ...msg });
  },

  async pushBooking(b: Booking) {
    const u = uid();
    if (!u) return;
    await safeSetDoc(['users', u, 'bookings', b.id], { ...b });
  },

  // Pull recent collections back from Firestore on first sign-in / new device.
  async pullAll(): Promise<void> {
    const fb = ensureFirebase();
    if (!fb) return;
    const u = fb.auth.currentUser?.uid;
    if (!u) return;

    const fetchCollection = async <T,>(name: string, orderField: string, max: number): Promise<T[]> => {
      try {
        const c = collection(fb.db, 'users', u, name);
        const snap = await getDocs(query(c, orderBy(orderField, 'desc'), limit(max)));
        return snap.docs.map((d) => d.data() as T);
      } catch {
        return [];
      }
    };

    const [moods, journals, checkins, chats] = await Promise.all([
      fetchCollection<MoodEntry>('moods', 'at', 365),
      fetchCollection<JournalEntry>('journals', 'at', 500),
      fetchCollection<CheckinEntry>('checkins', 'at', 365),
      fetchCollection<ChatMessage>('chats', 'at', 200),
    ]);

    const localMoods = await Storage.listMood();
    const merged = mergeById([...moods, ...localMoods], 'id');
    await Storage.replaceMood(merged.sort((a, b) => b.at - a.at).slice(0, 365));

    const localJournals = await Storage.listJournal();
    await Storage.replaceJournal(mergeById([...journals, ...localJournals], 'id').sort((a, b) => b.at - a.at));

    const localCheckins = await Storage.listCheckin();
    await Storage.replaceCheckin(mergeByKey([...checkins, ...localCheckins], 'date').sort((a, b) => b.at - a.at));

    if (chats.length) {
      const localChats = await Storage.getChat();
      await Storage.setChat(mergeById([...chats, ...localChats], 'id').sort((a, b) => a.at - b.at).slice(-200));
    }
  },

  // Best-effort backfill: push local writes that may have happened while signed-out.
  async pushBacklog(): Promise<void> {
    const fb = ensureFirebase();
    if (!fb) return;
    const u = fb.auth.currentUser?.uid;
    if (!u) return;

    try {
      const [moods, journals, checkins] = await Promise.all([Storage.listMood(), Storage.listJournal(), Storage.listCheckin()]);

      const batch = writeBatch(fb.db);
      moods.slice(0, 100).forEach((m) => {
        batch.set(doc(fb.db, 'users', u, 'moods', m.id), m, { merge: true });
      });
      journals.slice(0, 100).forEach((j) => {
        batch.set(doc(fb.db, 'users', u, 'journals', j.id), j, { merge: true });
      });
      checkins.slice(0, 100).forEach((c) => {
        batch.set(doc(fb.db, 'users', u, 'checkins', c.date), c, { merge: true });
      });
      await batch.commit();
    } catch {
      // best-effort
    }
  },
};

export type { Booking };

function mergeById<T extends { id: string }>(arr: T[], key: 'id'): T[] {
  const m = new Map<string, T>();
  for (const item of arr) m.set(item[key], item);
  return [...m.values()];
}

function mergeByKey<T extends Record<string, unknown>>(arr: T[], key: keyof T): T[] {
  const m = new Map<unknown, T>();
  for (const item of arr) m.set(item[key], item);
  return [...m.values()];
}
