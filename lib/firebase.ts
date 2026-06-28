import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  Auth,
  signInAnonymously,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
  EmailAuthProvider,
  linkWithCredential,
  signInWithCredential,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  deleteUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  runTransaction,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let initError: string | null = null;

function readConfig(): FirebaseConfig | null {
  const fromExtra = (Constants.expoConfig?.extra as { firebase?: FirebaseConfig } | undefined)?.firebase;
  if (!fromExtra) return null;
  if (!fromExtra.apiKey || !fromExtra.projectId) return null;
  if (fromExtra.appId.includes('REPLACE_WITH_WEB_APP_ID')) return null;
  return fromExtra;
}

export function ensureFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } | null {
  if (app && auth && db) return { app, auth, db };
  if (initError) return null;

  const cfg = readConfig();
  if (!cfg) {
    initError = 'firebase config missing or has placeholder appId';
    return null;
  }

  try {
    app = getApps()[0] ?? initializeApp(cfg);

    if (Platform.OS === 'web') {
      auth = getAuth(app);
    } else {
      try {
        // Dynamically import the RN persistence helper so web bundles don't choke on it.
        const rn = require('firebase/auth') as typeof import('firebase/auth') & {
          getReactNativePersistence?: (s: typeof AsyncStorage) => unknown;
        };
        if (rn.getReactNativePersistence) {
          auth = initializeAuth(app, { persistence: rn.getReactNativePersistence(AsyncStorage) as never });
        } else {
          auth = getAuth(app);
        }
      } catch {
        auth = getAuth(app);
      }
    }

    try {
      db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    } catch {
      db = getFirestore(app);
    }
    return { app, auth, db };
  } catch (e) {
    initError = (e as Error).message;
    app = null; auth = null; db = null;
    return null;
  }
}

export function firebaseAvailable(): boolean {
  return !!ensureFirebase();
}

export function firebaseInitError(): string | null {
  return initError;
}

export {
  signInAnonymously,
  fbSignOut,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential,
  signInWithCredential,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  deleteUser,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  serverTimestamp,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment,
  runTransaction,
};

export type { User };
