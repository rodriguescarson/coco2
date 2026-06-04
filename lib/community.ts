// Community (peer-support circles) data layer.
//
// Posts live in a shared top-level Firestore `posts` collection, keyed by
// circle id. Writes are gated by /api/moderate (crisis/harm/abuse) and by the
// Firestore security rules (ownership + shape). The client additionally hides
// removed, heavily-reported, and blocked-author posts. Abuse reports go to a
// write-only `reports` queue for human review.
//
// Anonymous identity: each user gets a stable, friendly handle stored locally
// (and mirrored to their private user doc). No real name is ever attached.

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import {
  ensureFirebase,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
} from './firebase';
import { moderateText, ModerationVerdict } from './chat';

export type CommunityPost = {
  id: string;
  circleId: string;
  authorUid: string;
  authorHandle: string;
  body: string;
  createdAtMs: number;
  reportCount: number;
  removed: boolean;
  mine: boolean;
};

export type CreatePostResult =
  | { ok: true; post: CommunityPost }
  | { ok: false; verdict: Exclude<ModerationVerdict['verdict'], 'allow'>; reason?: string; resources?: ModerationVerdict['resources'] }
  | { ok: false; verdict: 'unavailable'; reason: string };

// Posts hidden once this many people report them, pending human review.
const REPORT_HIDE_THRESHOLD = 3;
const MAX_BODY = 1000;

const K_HANDLE = '@coco/community-handle';
const K_GUIDELINES = '@coco/community-guidelines-accepted-at';
const K_BLOCKS = '@coco/community-blocked-uids';

function uid(): string | null {
  return ensureFirebase()?.auth.currentUser?.uid ?? null;
}

export function communityAvailable(): boolean {
  return !!ensureFirebase() && !!uid();
}

// Current signed-in uid, surfaced in the Moderation screen so an admin can copy
// it into app.json `extra.adminUids` and firestore.rules `isAdmin()`.
export function currentUid(): string | null {
  return uid();
}

function adminUids(): string[] {
  const list = (Constants.expoConfig?.extra as { adminUids?: string[] } | undefined)?.adminUids;
  return Array.isArray(list) ? list : [];
}

// Client-side gate for the Moderation screen. The Firestore rules are the real
// enforcement — this just hides the UI from non-moderators.
export function isModerator(): boolean {
  const u = uid();
  return !!u && adminUids().includes(u);
}

// --- Anonymous handle -------------------------------------------------------
const ADJECTIVES = ['Quiet', 'Gentle', 'Steady', 'Kind', 'Brave', 'Calm', 'Soft', 'Open', 'Warm', 'Patient'];
const NOUNS = ['River', 'Maple', 'Harbor', 'Meadow', 'Ember', 'Willow', 'Pebble', 'Lantern', 'Heron', 'Cedar'];

export async function getHandle(): Promise<string> {
  const existing = await AsyncStorage.getItem(K_HANDLE);
  if (existing) return existing;
  const handle = `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]}${
    NOUNS[Math.floor(Math.random() * NOUNS.length)]
  }${Math.floor(Math.random() * 90 + 10)}`;
  await AsyncStorage.setItem(K_HANDLE, handle);
  return handle;
}

// --- Community guidelines gate ---------------------------------------------
export async function hasAcceptedGuidelines(): Promise<boolean> {
  return !!(await AsyncStorage.getItem(K_GUIDELINES));
}

export async function acceptGuidelines(): Promise<void> {
  const at = Date.now();
  await AsyncStorage.setItem(K_GUIDELINES, String(at));
  // Best-effort mirror to the user's private doc (proves acceptance per-account).
  const fb = ensureFirebase();
  const u = uid();
  if (fb && u) {
    try {
      await setDoc(
        doc(fb.db, 'users', u, 'community', 'main'),
        { guidelinesAcceptedAt: at, handle: await getHandle(), updatedAt: serverTimestamp() },
        { merge: true },
      );
    } catch {
      // local acceptance is authoritative for gating
    }
  }
}

// --- Blocking ---------------------------------------------------------------
export async function getBlocked(): Promise<string[]> {
  try {
    return JSON.parse((await AsyncStorage.getItem(K_BLOCKS)) ?? '[]') as string[];
  } catch {
    return [];
  }
}

export async function blockAuthor(authorUid: string): Promise<void> {
  const list = await getBlocked();
  if (!list.includes(authorUid)) {
    list.push(authorUid);
    await AsyncStorage.setItem(K_BLOCKS, JSON.stringify(list));
  }
  const fb = ensureFirebase();
  const u = uid();
  if (fb && u) {
    try {
      await setDoc(doc(fb.db, 'users', u, 'blocks', authorUid), { at: Date.now() }, { merge: true });
    } catch {
      // local block list is authoritative for filtering
    }
  }
}

// --- Reading the feed -------------------------------------------------------
export async function fetchPosts(circleId: string, max = 50): Promise<CommunityPost[]> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return [];

  const blocked = new Set(await getBlocked());
  try {
    const c = collection(fb.db, 'posts');
    const snap = await getDocs(
      query(c, where('circleId', '==', circleId), orderBy('createdAtMs', 'desc'), limit(max)),
    );
    return snap.docs
      .map((d) => {
        const data = d.data() as Omit<CommunityPost, 'id' | 'mine'>;
        return {
          id: d.id,
          circleId: data.circleId,
          authorUid: data.authorUid,
          authorHandle: data.authorHandle,
          body: data.body,
          createdAtMs: data.createdAtMs ?? 0,
          reportCount: data.reportCount ?? 0,
          removed: !!data.removed,
          mine: data.authorUid === u,
        };
      })
      .filter((p) => !p.removed && p.reportCount < REPORT_HIDE_THRESHOLD && !blocked.has(p.authorUid));
  } catch {
    return [];
  }
}

// --- Creating a post (moderated) -------------------------------------------
export async function createPost(circleId: string, rawBody: string): Promise<CreatePostResult> {
  const body = rawBody.trim().slice(0, MAX_BODY);
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) {
    return { ok: false, verdict: 'unavailable', reason: "Circles need a connection. You're offline or not signed in." };
  }
  if (!body) {
    return { ok: false, verdict: 'block', reason: 'Write something first.' };
  }

  const verdict = await moderateText(body);
  if (verdict.verdict !== 'allow') {
    return { ok: false, verdict: verdict.verdict, reason: verdict.reason, resources: verdict.resources };
  }

  const handle = await getHandle();
  try {
    const ref = await addDoc(collection(fb.db, 'posts'), {
      circleId,
      authorUid: u,
      authorHandle: handle,
      body,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp(),
      reportCount: 0,
      removed: false,
    });
    return {
      ok: true,
      post: {
        id: ref.id,
        circleId,
        authorUid: u,
        authorHandle: handle,
        body,
        createdAtMs: Date.now(),
        reportCount: 0,
        removed: false,
        mine: true,
      },
    };
  } catch (e) {
    return { ok: false, verdict: 'unavailable', reason: (e as Error).message?.slice(0, 140) || 'Could not post right now.' };
  }
}

// --- Reporting & deleting ---------------------------------------------------
export async function reportPost(post: CommunityPost, reason: string): Promise<boolean> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return false;
  try {
    await addDoc(collection(fb.db, 'reports'), {
      postId: post.id,
      circleId: post.circleId,
      reporterUid: u,
      reason: reason.slice(0, 200),
      createdAt: serverTimestamp(),
    });
    // Bump the report count so it auto-hides once enough people flag it.
    await updateDoc(doc(fb.db, 'posts', post.id), {
      reportCount: increment(1),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteOwnPost(post: CommunityPost): Promise<boolean> {
  const fb = ensureFirebase();
  if (!fb) return false;
  try {
    await deleteDoc(doc(fb.db, 'posts', post.id));
    return true;
  } catch {
    return false;
  }
}

// --- Moderation (admin-only; gated by adminUids + Firestore isAdmin()) ------
export type OpenReport = {
  id: string;
  postId: string;
  circleId: string;
  reason: string;
  reportedAtMs: number;
  // The reported post, if it still exists.
  post?: { body: string; authorHandle: string; authorUid: string; removed: boolean };
};

// Reads the /reports queue (admins only) and hydrates each with its post.
export async function listOpenReports(max = 50): Promise<OpenReport[]> {
  const fb = ensureFirebase();
  if (!fb || !isModerator()) return [];
  try {
    const snap = await getDocs(query(collection(fb.db, 'reports'), orderBy('createdAt', 'desc'), limit(max)));
    const reports = await Promise.all(
      snap.docs.map(async (d) => {
        const r = d.data() as { postId: string; circleId: string; reason: string; createdAt?: { toMillis?: () => number } };
        let post: OpenReport['post'];
        try {
          const ps = await getDoc(doc(fb.db, 'posts', r.postId));
          if (ps.exists()) {
            const pd = ps.data() as { body: string; authorHandle: string; authorUid: string; removed?: boolean };
            post = { body: pd.body, authorHandle: pd.authorHandle, authorUid: pd.authorUid, removed: !!pd.removed };
          }
        } catch {
          // post may be gone; report still shown so it can be dismissed
        }
        return {
          id: d.id,
          postId: r.postId,
          circleId: r.circleId,
          reason: r.reason,
          reportedAtMs: r.createdAt?.toMillis?.() ?? 0,
          post,
        };
      }),
    );
    return reports;
  } catch {
    return [];
  }
}

// Moderator removes a post (hides it from every feed). Reversible by clearing
// the flag in the console; the post is not destroyed.
export async function moderatorRemovePost(postId: string): Promise<boolean> {
  const fb = ensureFirebase();
  if (!fb || !isModerator()) return false;
  try {
    await updateDoc(doc(fb.db, 'posts', postId), { removed: true, updatedAt: serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

// Clears a report from the queue without removing the post (false alarm).
export async function dismissReport(reportId: string): Promise<boolean> {
  const fb = ensureFirebase();
  if (!fb || !isModerator()) return false;
  try {
    await deleteDoc(doc(fb.db, 'reports', reportId));
    return true;
  } catch {
    return false;
  }
}
