// Referral / invite loop — gentle, opt-in, no paywall.
//
// Mental-health-appropriate by design: a referral records only *who invited
// whom* (two uids + a timestamp). No mood, journal, check-in, chat, or any
// clinical data is ever read or written here, and none of it is shared in an
// invite. The only "reward" is a soft recognition line ("you've helped N
// friends find a calmer moment") — never a feature unlock or paywall.
//
// Data model (Firestore):
//   users/{uid}.referralCode        short, ambiguity-free code (6 chars)
//   users/{uid}.referredBy          uid of the referrer, set once
//   referralCodes/{CODE} → { uid }  public lookup table (code → referrer uid)
//   referrals/{referrerId_referredId} → { referrerId, referredId, createdAt }
//
// Attribution integrity — NOTE THE TRADE-OFF. This app has NO Firebase Cloud
// Functions backend (firebase.json declares only Firestore; the Vercel `api/`
// functions run on the edge runtime and can't cleanly host firebase-admin), so
// the claim runs as a CLIENT-SIDE transaction guarded by tight firestore.rules
// rather than a trusted callable function. The rules enforce the hard
// invariants — referredId must equal the caller, you can't refer yourself, the
// referrer must be a real account, the referral doc id is deterministic so a
// pair can't be double-claimed, and referral docs are immutable. The remaining
// (accepted) weakness: a determined user who already knows another account's
// code could self-attribute to it. That's harmless here because the reward is
// purely a gentle count with no unlock — there's nothing to farm. If a Cloud
// Functions backend is ever added, move claimReferral() server-side.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ensureFirebase,
  doc,
  setDoc,
  getDoc,
  collection,
  serverTimestamp,
  query,
  where,
  getDocs,
  runTransaction,
} from './firebase';

// Ambiguity-free alphabet: no 0/O/1/I to keep codes easy to read out loud.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_GEN_ATTEMPTS = 6;

// Stash for a code that arrived (deep link / paste) before we could claim it —
// survives app restarts and the anonymous→signed-up transition.
const K_PENDING = '@coco/pending-referral';

export type ClaimResult =
  | { ok: true }
  | { ok: false; reason: 'self' | 'already' | 'invalid' | 'unavailable' | 'empty' };

function uid(): string | null {
  return ensureFirebase()?.auth.currentUser?.uid ?? null;
}

export function referralsAvailable(): boolean {
  return !!ensureFirebase() && !!uid();
}

// Normalise user-typed / link codes: trim, uppercase, drop anything outside the
// alphabet (e.g. spaces or dashes someone added by hand).
export function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .split('')
    .filter((c) => ALPHABET.includes(c))
    .join('')
    .slice(0, CODE_LENGTH);
}

function randomCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

// Returns the current user's referral code, generating + reserving one on first
// call (lazy, collision-checked). No Cloud Functions trigger exists, so this is
// the creation path. Best-effort: returns null if offline / not signed in.
export async function ensureReferralCode(): Promise<string | null> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return null;

  try {
    const userRef = doc(fb.db, 'users', u);
    const snap = await getDoc(userRef);
    const existing = snap.exists() ? (snap.data().referralCode as string | undefined) : undefined;
    if (existing) return existing;

    for (let attempt = 0; attempt < MAX_GEN_ATTEMPTS; attempt++) {
      const code = randomCode();
      const codeRef = doc(fb.db, 'referralCodes', code);
      const taken = await getDoc(codeRef);
      if (taken.exists()) continue; // collision — try another
      // Reserve the code (create-only in rules) then mirror onto the user doc.
      await setDoc(codeRef, { uid: u, createdAt: serverTimestamp() });
      await setDoc(userRef, { referralCode: code }, { merge: true });
      return code;
    }
    return null;
  } catch {
    return null;
  }
}

// Reads the user's code without generating one (cheap; for display only).
export async function getReferralCode(): Promise<string | null> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return null;
  try {
    const snap = await getDoc(doc(fb.db, 'users', u));
    return snap.exists() ? ((snap.data().referralCode as string | undefined) ?? null) : null;
  } catch {
    return null;
  }
}

export type ReferralStats = {
  // How many friends accepted this user's invite.
  count: number;
  // Whether this user themselves joined through someone's invite.
  referredBy: string | null;
};

export async function getReferralStats(): Promise<ReferralStats> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return { count: 0, referredBy: null };
  try {
    const userSnap = await getDoc(doc(fb.db, 'users', u));
    const referredBy = userSnap.exists() ? ((userSnap.data().referredBy as string | undefined) ?? null) : null;

    // Single-field equality query — no composite index required.
    const snap = await getDocs(query(collection(fb.db, 'referrals'), where('referrerId', '==', u)));
    return { count: snap.size, referredBy };
  } catch {
    return { count: 0, referredBy: null };
  }
}

// Claim a referral code: record that the current user joined through `rawCode`.
// Runs in a transaction so referredBy is set exactly once and the referral doc
// is written atomically. The firestore.rules are the real guard.
export async function claimReferral(rawCode: string): Promise<ClaimResult> {
  const fb = ensureFirebase();
  const u = uid();
  if (!fb || !u) return { ok: false, reason: 'unavailable' };

  const code = normalizeCode(rawCode);
  if (!code || code.length < CODE_LENGTH) return { ok: false, reason: 'empty' };

  try {
    // Resolve code → referrer uid via the public lookup table.
    const codeSnap = await getDoc(doc(fb.db, 'referralCodes', code));
    if (!codeSnap.exists()) return { ok: false, reason: 'invalid' };
    const referrerId = codeSnap.data().uid as string | undefined;
    if (!referrerId) return { ok: false, reason: 'invalid' };
    if (referrerId === u) return { ok: false, reason: 'self' };

    const userRef = doc(fb.db, 'users', u);
    const referralRef = doc(fb.db, 'referrals', `${referrerId}_${u}`);

    const outcome = await runTransaction(fb.db, async (tx) => {
      const userTx = await tx.get(userRef);
      const already = userTx.exists() ? (userTx.data().referredBy as string | undefined) : undefined;
      if (already) return 'already' as const;

      tx.set(referralRef, { referrerId, referredId: u, createdAt: serverTimestamp() });
      tx.set(userRef, { referredBy: referrerId }, { merge: true });
      return 'ok' as const;
    });

    return outcome === 'ok' ? { ok: true } : { ok: false, reason: 'already' };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

// --- Pending code stash (deep link / install→signup) -----------------------
export async function stashPendingReferral(rawCode: string): Promise<void> {
  const code = normalizeCode(rawCode);
  if (!code) return;
  try {
    await AsyncStorage.setItem(K_PENDING, code);
  } catch {
    // best-effort
  }
}

export async function getPendingReferral(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(K_PENDING);
  } catch {
    return null;
  }
}

export async function clearPendingReferral(): Promise<void> {
  try {
    await AsyncStorage.removeItem(K_PENDING);
  } catch {
    // best-effort
  }
}

// Best-effort: if a code is stashed and the user hasn't been referred yet, try
// to claim it. Called once the user is known (see AuthBootstrap). Silent — the
// Invite screen surfaces success; we never nag here.
export async function claimPendingReferral(): Promise<void> {
  const pending = await getPendingReferral();
  if (!pending) return;
  const result = await claimReferral(pending);
  // Clear on any terminal outcome (claimed, self, already, invalid). Keep it
  // stashed only on a transient 'unavailable' so a later attempt can succeed.
  if (result.ok || result.reason !== 'unavailable') {
    await clearPendingReferral();
  }
}

// --- React hook for the Invite screen --------------------------------------
export function useReferral(): {
  code: string | null;
  stats: ReferralStats;
  loading: boolean;
  available: boolean;
  reload: () => void;
} {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats>({ count: 0, referredBy: null });
  const [loading, setLoading] = useState(true);
  const available = referralsAvailable();

  const reload = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [c, s] = await Promise.all([ensureReferralCode(), getReferralStats()]);
      if (cancelled) return;
      setCode(c);
      setStats(s);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = reload();
    return cleanup;
  }, [reload]);

  return { code, stats, loading, available, reload };
}

// Recognition line for the reward badge — gentle, never clinical.
export function recognitionLine(count: number): string {
  if (count <= 0) return 'Share Coco with someone who might need a calmer moment.';
  if (count === 1) return "You've helped 1 friend find a calmer moment.";
  return `You've helped ${count} friends find a calmer moment.`;
}
