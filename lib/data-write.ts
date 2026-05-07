// Single source of truth for "write a record" operations: writes locally first,
// then best-effort mirrors to Firestore via Sync. Screens should import from
// here rather than calling Storage.add* directly when sync is desired.

import { Storage, MoodEntry, JournalEntry, CheckinEntry, UserProfile, ContactProfile, Booking } from './storage';
import { Sync } from './sync';
import type { ChatMessage } from './chat';

export const DataWrite = {
  async addMood(e: MoodEntry) {
    await Storage.addMood(e);
    Sync.pushMood(e);
  },
  async addJournal(e: JournalEntry) {
    await Storage.addJournal(e);
    Sync.pushJournal(e);
  },
  async addCheckin(e: CheckinEntry) {
    await Storage.addCheckin(e);
    Sync.pushCheckin(e);
  },
  async addChat(m: ChatMessage) {
    Sync.pushChat(m);
  },
  async setUser(u: UserProfile) {
    await Storage.setUser(u);
    Sync.pushProfile(u);
  },
  async setContact(c: ContactProfile) {
    await Storage.setContact(c);
    const u = await Storage.getUser();
    Sync.pushProfile({ ...u, ...c });
  },
  async addBooking(b: Booking) {
    await Storage.addBooking(b);
    Sync.pushBooking(b);
  },
  async cancelBooking(id: string) {
    await Storage.cancelBooking(id);
    const list = await Storage.listBookings();
    const b = list.find((x) => x.id === id);
    if (b) Sync.pushBooking(b);
  },
};
