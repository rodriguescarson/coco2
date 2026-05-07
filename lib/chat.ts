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
