import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
// NOTE: @react-native-google-signin/google-signin is a custom native module, so
// it is NOT present in Expo Go (its index runs TurboModuleRegistry.getEnforcing
// at import time and throws there). We therefore lazy-require it only on a
// dev/production build — never import it statically — so this file still loads
// in Expo Go with Google sign-in gracefully disabled.

import {
  ensureFirebase,
  signInAnonymously,
  fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  User,
} from './firebase';
import { loginPurchases, logoutPurchases } from './purchases';

export type CocoUser = {
  uid: string;
  isAnonymous: boolean;
  email: string | null;
  displayName: string | null;
};

function toCocoUser(u: User): CocoUser {
  return { uid: u.uid, isAnonymous: u.isAnonymous, email: u.email, displayName: u.displayName };
}

export function useAuth(): { user: CocoUser | null; ready: boolean; available: boolean } {
  const [user, setUser] = useState<CocoUser | null>(null);
  const [ready, setReady] = useState(false);
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const fb = ensureFirebase();
    if (!fb) {
      setAvailable(false);
      setReady(true);
      return;
    }
    setAvailable(true);
    const unsub = onAuthStateChanged(fb.auth, async (u) => {
      if (u) {
        setUser(toCocoUser(u));
        // Keep RevenueCat's appUserID in lock-step with the Firebase uid so a
        // purchase follows the user across devices (and survives an anonymous →
        // real-account upgrade, which keeps the same uid). Best-effort.
        void loginPurchases(u.uid).catch(() => {});
        await touchProfile(u.uid);
      } else {
        // Auto sign-in anonymously so cloud sync works without forcing a sign-in.
        try {
          const cred = await signInAnonymously(fb.auth);
          setUser(toCocoUser(cred.user));
          void loginPurchases(cred.user.uid).catch(() => {});
          await touchProfile(cred.user.uid);
        } catch {
          setUser(null);
        }
      }
      setReady(true);
    });
    return unsub;
  }, []);

  return { user, ready, available };
}

async function touchProfile(uid: string) {
  const fb = ensureFirebase();
  if (!fb) return;
  const ref = doc(fb.db, 'users', uid);
  const snap = await getDoc(ref).catch(() => null);
  if (!snap || !snap.exists()) {
    await setDoc(ref, { createdAt: serverTimestamp(), lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
  } else {
    await setDoc(ref, { lastSeenAt: serverTimestamp() }, { merge: true }).catch(() => {});
  }
}

export async function signOut(): Promise<void> {
  const fb = ensureFirebase();
  if (!fb) return;
  // Reset RevenueCat back to an anonymous customer before Firebase signs out,
  // so the next signed-in user doesn't inherit this user's entitlement state.
  await logoutPurchases();
  await fbSignOut(fb.auth);
}

// Email + password. The caller passes the intended mode so we don't guess:
//  - 'signin' → log in to an EXISTING account (we must NOT try to create/link,
//    otherwise an anonymous current user makes every attempt fail with
//    auth/email-already-in-use).
//  - 'signup' → create a NEW account. If there's an anonymous user, link the
//    credential to it so local-only data carries over; otherwise create fresh.
export async function upgradeWithEmailPassword(
  email: string,
  password: string,
  mode: 'signin' | 'signup',
): Promise<void> {
  const fb = ensureFirebase();
  if (!fb) throw new Error('Firebase not configured');
  const current = fb.auth.currentUser;

  if (mode === 'signin') {
    const credential = EmailAuthProvider.credential(email, password);
    await signInWithCredential(fb.auth, credential);
    return;
  }

  // signup
  if (current && current.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(current, credential);
  } else {
    await createUserWithEmailAndPassword(fb.auth, email, password);
  }
}

// Google sign-in via the native Google Sign-In SDK
// (@react-native-google-signin/google-signin).
//
// We migrated off expo-auth-session: its useIdTokenAuthRequest ran the OAuth
// implicit flow against the *web* client with a custom-scheme redirect, which
// Google now blocks ("Access blocked: doesn't comply with Google's OAuth 2.0
// policy", Error 400: invalid_request). The native SDK uses
// ASWebAuthenticationSession and is compliant.
//
// configure() needs the WEB client id so the returned idToken's audience is one
// Firebase accepts; iosClientId drives the native iOS flow. Requires a native
// build — this will not work in Expo Go.
// Expo Go runs the prebuilt "store client" binary, which has no custom native
// modules — so we must never touch the Google SDK there.
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Lazy accessor so the native module is only required on a real build.
function getGoogleSignin() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
}

let googleConfigured = false;
function configureGoogle() {
  if (googleConfigured) return;
  const extra = (Constants.expoConfig?.extra ?? {}) as {
    googleClientIdWeb?: string;
    googleClientIdIos?: string;
  };
  getGoogleSignin().GoogleSignin.configure({
    webClientId: extra.googleClientIdWeb,
    iosClientId: extra.googleClientIdIos,
  });
  googleConfigured = true;
}

export function useGoogleSignIn() {
  async function start(): Promise<{ ok: true } | { ok: false; reason: string }> {
    const fb = ensureFirebase();
    if (!fb) return { ok: false, reason: 'Firebase not configured' };
    if (isExpoGo) {
      return { ok: false, reason: 'Google sign-in needs the full app build — it is unavailable in Expo Go.' };
    }
    const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = getGoogleSignin();
    try {
      configureGoogle();
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return { ok: false, reason: 'cancelled' };
      const idToken = response.data.idToken;
      if (!idToken) return { ok: false, reason: 'No id_token returned by Google' };
      const credential = GoogleAuthProvider.credential(idToken);
      const current = fb.auth.currentUser;
      if (current && current.isAnonymous) {
        await linkWithCredential(current, credential);
      } else {
        await signInWithCredential(fb.auth, credential);
      }
      return { ok: true };
    } catch (e) {
      if (isErrorWithCode(e)) {
        if (e.code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, reason: 'cancelled' };
        if (e.code === statusCodes.IN_PROGRESS) return { ok: false, reason: 'Sign-in already in progress' };
        if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return { ok: false, reason: 'Google Play Services not available' };
        }
      }
      return { ok: false, reason: (e as Error).message ?? 'Google sign-in failed' };
    }
  }

  return { start, ready: !isExpoGo };
}

// Generate a one-time nonce for Apple sign-in. Apple embeds SHA-256(rawNonce)
// in the identity token; Firebase recomputes it from the rawNonce we pass to
// credential() and rejects the token if they don't match. Omitting this can
// surface as auth/invalid-credential or missing-or-invalid-nonce.
async function makeAppleNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  const rawNonce = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );
  return { rawNonce, hashedNonce };
}

// Apple sign-in (iOS native).
export async function signInWithApple(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (Platform.OS !== 'ios') return { ok: false, reason: 'Apple sign-in is iOS only' };
  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { ok: false, reason: 'Apple sign-in unavailable on this device' };
  const fb = ensureFirebase();
  if (!fb) return { ok: false, reason: 'Firebase not configured' };

  try {
    const { rawNonce, hashedNonce } = await makeAppleNonce();
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
    const provider = new OAuthProvider('apple.com');
    const fbCredential = provider.credential({
      idToken: credential.identityToken!,
      rawNonce,
    });
    const current = fb.auth.currentUser;
    if (current && current.isAnonymous) {
      await linkWithCredential(current, fbCredential);
    } else {
      await signInWithCredential(fb.auth, fbCredential);
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: (e as Error).message };
  }
}
