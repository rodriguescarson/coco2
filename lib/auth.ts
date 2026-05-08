import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

// True when the app is running inside Expo Go (the prebuilt host app),
// rather than a custom dev client or a production build. Apple Sign-In via
// Firebase will *always* fail here because the ID token audience is
// host.exp.Exponent and Firebase expects your bundle ID.
const isExpoGo = Constants.appOwnership === 'expo';
export { isExpoGo };
import {
  ensureFirebase,
  signInAnonymously,
  fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  EmailAuthProvider,
  linkWithCredential,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  User,
} from './firebase';

WebBrowser.maybeCompleteAuthSession();

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
        await touchProfile(u.uid);
      } else {
        // Auto sign-in anonymously so cloud sync works without forcing a sign-in.
        try {
          const cred = await signInAnonymously(fb.auth);
          setUser(toCocoUser(cred.user));
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
  await fbSignOut(fb.auth);
}

// Email + password (progressive — links to current anon account if present)
export async function upgradeWithEmailPassword(email: string, password: string): Promise<void> {
  const fb = ensureFirebase();
  if (!fb) throw new Error('Firebase not configured');
  const current = fb.auth.currentUser;
  const credential = EmailAuthProvider.credential(email, password);
  if (current && current.isAnonymous) {
    await linkWithCredential(current, credential);
  } else {
    await signInWithCredential(fb.auth, credential);
  }
}

// Google sign-in via expo-auth-session.
// Caller should use useGoogleSignIn() inside a component for the request/promptAsync hooks.
export function useGoogleSignIn() {
  const clientId = (Constants.expoConfig?.extra as { googleClientIdWeb?: string } | undefined)?.googleClientIdWeb;
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId,
    iosClientId: clientId,
    androidClientId: clientId,
    webClientId: clientId,
  });

  async function start(): Promise<{ ok: true } | { ok: false; reason: string }> {
    const fb = ensureFirebase();
    if (!fb) return { ok: false, reason: 'Firebase not configured' };
    if (!clientId) return { ok: false, reason: 'Google client id not configured' };
    if (!request) return { ok: false, reason: 'Google sign-in not ready yet' };
    const r = await promptAsync();
    if (r?.type !== 'success') return { ok: false, reason: r?.type ?? 'cancelled' };
    const idToken = r.authentication?.idToken;
    if (!idToken) return { ok: false, reason: 'No id token returned' };
    const credential = GoogleAuthProvider.credential(idToken);
    const current = fb.auth.currentUser;
    if (current && current.isAnonymous) {
      await linkWithCredential(current, credential);
    } else {
      await signInWithCredential(fb.auth, credential);
    }
    return { ok: true };
  }

  return { start, ready: !!request, response };
}

// Apple sign-in (iOS native; requires a development build, not Expo Go).
export async function signInWithApple(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (Platform.OS !== 'ios') return { ok: false, reason: 'Apple sign-in is iOS only' };
  if (isExpoGo) {
    return {
      ok: false,
      reason:
        'Apple Sign-In can\'t be used inside Expo Go. The token audience would be host.exp.Exponent, which Firebase rejects. Run a development build (npx expo prebuild + eas build --profile development) to enable it.',
    };
  }
  const available = await AppleAuthentication.isAvailableAsync().catch(() => false);
  if (!available) return { ok: false, reason: 'Apple sign-in unavailable on this device' };
  const fb = ensureFirebase();
  if (!fb) return { ok: false, reason: 'Firebase not configured' };

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const provider = new OAuthProvider('apple.com');
    const fbCredential = provider.credential({
      idToken: credential.identityToken!,
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
