import Constants from 'expo-constants';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: number;
  meta?: { crisisDetected?: boolean };
};

export type ChatRequest = {
  messages: { role: 'user' | 'assistant' | 'system'; content: string }[];
  user?: { name?: string };
};

export type ChatResponse = {
  reply: string;
  crisisDetected?: boolean;
  resources?: { label: string; phone?: string; url?: string }[];
};

function getBaseUrl(): string {
  const fromExtra = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  return fromEnv || fromExtra || 'https://coco-api.vercel.app';
}

export async function sendChat(req: ChatRequest, signal?: AbortSignal): Promise<ChatResponse> {
  const url = `${getBaseUrl().replace(/\/$/, '')}/api/chat`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(req),
    signal,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Chat request failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return (await res.json()) as ChatResponse;
}

export function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// Uploads a recorded audio file to /api/transcribe (which forwards to Groq
// Whisper) and returns the transcript. The uri is a local file:// path from the
// expo-audio recorder. React Native's fetch accepts the { uri, name, type }
// shape for multipart file parts.
export async function transcribeAudio(uri: string, signal?: AbortSignal): Promise<string> {
  const url = `${getBaseUrl().replace(/\/$/, '')}/api/transcribe`;
  const name = uri.split('/').pop() || 'recording.m4a';
  const form = new FormData();
  // The RN FormData file part is intentionally cast — the web Blob type doesn't
  // match, but the native bridge expects this { uri, name, type } shape.
  form.append('file', { uri, name, type: 'audio/m4a' } as unknown as Blob, name);

  const res = await fetch(url, { method: 'POST', body: form, signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Transcription failed (${res.status}): ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return (data.text ?? '').trim();
}

export type ModerationVerdict = {
  verdict: 'allow' | 'block' | 'crisis';
  reason?: string;
  resources?: { label: string; phone?: string; url?: string }[];
};

// Runs community post text through /api/moderate (same crisis/harm guardrails
// as chat, plus peer-abuse checks). Callers must honour the verdict before
// publishing. On network failure we fall back to a conservative local crisis
// check so a crisis is never silently posted.
export async function moderateText(text: string, signal?: AbortSignal): Promise<ModerationVerdict> {
  const url = `${getBaseUrl().replace(/\/$/, '')}/api/moderate`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });
    if (!res.ok) throw new Error(`moderate ${res.status}`);
    return (await res.json()) as ModerationVerdict;
  } catch {
    if (detectCrisis(text)) {
      return {
        verdict: 'crisis',
        reason: "It sounds heavy — and circles aren't monitored in real time. Please reach out to someone who can respond now.",
        resources: [{ label: 'Open SOS in the app', url: 'coco://sos' }],
      };
    }
    return { verdict: 'allow' };
  }
}

// Client-side guardrails: detect obvious crisis keywords so we can surface SOS
// even before the network request returns. The server applies the authoritative
// check; this is just for instant UX feedback.
const crisisPatterns = [
  /\b(kill\s*my\s*self|kill\s*me|end\s*my\s*life|end\s*it\s*all)\b/i,
  /\b(suicid(e|al))\b/i,
  /\b(want\s*to\s*die|wanna\s*die)\b/i,
  /\b(self[-\s]?harm|cut\s*myself|hurt\s*myself)\b/i,
  /\bno\s*reason\s*to\s*live\b/i,
];

export function detectCrisis(text: string): boolean {
  return crisisPatterns.some((p) => p.test(text));
}
