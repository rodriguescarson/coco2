// First-use consent for sharing data with the third-party AI processor.
//
// Apple Guideline 5.1.1(i) / 5.1.2(i): before any personal data is sent to a
// third-party AI service we must disclose what is sent, name who it goes to, and
// get the user's permission. This module stores that consent decision and the
// callers (chat, voice journaling) gate their network calls on it.

import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AI_PROVIDER_NAME } from './legal';

const KEY = '@coco/ai-consent';

// Bump this if the disclosure materially changes, to re-prompt existing users.
export const CONSENT_VERSION = 1;

type StoredConsent = { granted: boolean; version: number; at: number };

// Plain-language list of exactly what leaves the device, shown in the gate.
export const AI_DATA_DISCLOSURE: { title: string; detail: string }[] = [
  {
    title: 'What is sent',
    detail:
      'The messages you type to Coco, and your first name if you set one. For voice journaling, the audio you record is sent to be turned into text.',
  },
  {
    title: 'Who it goes to',
    detail: `${AI_PROVIDER_NAME}, a third-party AI provider that generates Coco's replies and transcribes voice notes.`,
  },
  {
    title: 'What is not sent',
    detail:
      'Your moods, journal entries, check-ins and recorded audio are not stored by the AI provider. Audio is transcribed and then discarded; only the resulting text returns to your device.',
  },
];

export async function readAiConsent(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return false;
    const v = JSON.parse(raw) as StoredConsent;
    return !!v.granted && v.version >= CONSENT_VERSION;
  } catch {
    return false;
  }
}

export async function setAiConsent(granted: boolean): Promise<void> {
  const value: StoredConsent = { granted, version: CONSENT_VERSION, at: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(value));
}

// Hook for screens that need to gate AI network calls on consent.
export function useAiConsent() {
  const [consented, setConsented] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    let active = true;
    readAiConsent().then((v) => {
      if (active) setConsented(v);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => refresh(), [refresh]);

  const grant = useCallback(async () => {
    await setAiConsent(true);
    setConsented(true);
  }, []);

  const revoke = useCallback(async () => {
    await setAiConsent(false);
    setConsented(false);
  }, []);

  return { consented, loading: consented === null, grant, revoke };
}
