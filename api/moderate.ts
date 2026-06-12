// Vercel serverless function: POST /api/moderate
// Server-side gate for community (peer-support) posts. Reuses the chat
// pipeline's crisis + harm detection and adds peer-abuse checks. Returns a
// verdict the client must honour before writing a post to Firestore:
//
//   { verdict: "allow" }
//   { verdict: "crisis",  resources: [...] }   // don't post; surface SOS
//   { verdict: "block",   reason: "..." }       // don't post; explain gently
//
// This is text-only; no audio, no storage. It mirrors the guardrails in
// api/chat.ts so the same standards apply whether a user talks to Coco or
// posts to a circle.

import { guard } from './_auth';

export const config = { runtime: 'edge' };

type Body = { text?: string };

// --- Crisis (self-harm / suicide) — mirror of api/chat.ts -------------------
const crisisPatterns = [
  /\b(kill\s*my\s*self|kill\s*me|end\s*my\s*life|end\s*it\s*all)\b/i,
  /\b(suicid(e|al))\b/i,
  /\b(want\s*to\s*die|wanna\s*die)\b/i,
  /\b(self[-\s]?harm|cut\s*myself|hurt\s*myself)\b/i,
  /\bno\s*reason\s*to\s*live\b/i,
  /\b(overdose|jump\s*off)\b/i,
  /\bk\.?m\.?s\.?\b/i,
  /\bunalive\b/i,
  /\bbetter\s*off\s*(without\s*me|dead|gone)\b/i,
  /\bdon'?t\s*want\s*to\s*be\s*here\b/i,
  /\bnobody\s*would\s*(care|miss\s*me|notice)\b/i,
];

// --- Harmful instruction / method content -----------------------------------
const harmfulPatterns = [
  /\bhow\s*(many|much|do\s*i|to)\b.*\b(pills|overdose|hang|cut|kill)\b/i,
  /\bwhat('?s| is)\s*the\s*(best|easiest|quickest|painless)\s*way\s*to\s*(die|kill)/i,
  // Encouraging others toward self-harm / ED behaviours — unacceptable in a circle.
  /\byou\s*should\s*(just\s*)?(kill|unalive|end)\s*your/i,
  /\b(go\s*)?(kys|kill\s*your\s*self)\b/i,
  /\b(pro[-\s]?ana|pro[-\s]?mia|thinspo|how\s*to\s*purge)\b/i,
];

// --- Peer abuse / harassment (community-specific) ----------------------------
const abusePatterns = [
  /\b(f|ph)agg?ots?\b/i,
  /\bn[i1]gg(er|a)s?\b/i,
  /\bret(a|@)rds?\b/i,
  /\b(c|k)unts?\b/i,
  /\byou'?re\s*(such\s*)?(a\s*)?(worthless|pathetic|disgusting)\b/i,
];

function anyMatch(patterns: RegExp[], text: string): boolean {
  return patterns.some((p) => p.test(text));
}

function corsHeaders() {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type, authorization',
    'access-control-allow-methods': 'POST, OPTIONS',
  } as Record<string, string>;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // Auth (monitor mode unless ENFORCE_AUTH=true) + soft per-identity rate limit.
  const { rejection } = await guard(req, corsHeaders());
  if (rejection) return rejection;

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  const text = String(body?.text ?? '').slice(0, 4000);
  if (!text.trim()) {
    return json({ verdict: 'block', reason: 'Write something first.' });
  }

  if (anyMatch(crisisPatterns, text)) {
    return json({
      verdict: 'crisis',
      reason:
        "It sounds like you're carrying something really heavy. Circles aren't monitored in real time, so please reach out to someone who can respond right now.",
      resources: [
        { label: 'Open SOS in the app', url: 'coco://sos' },
        { label: '988 Lifeline (US)', phone: '988' },
        { label: 'Crisis Text Line (US)', phone: '741741' },
        { label: 'Befrienders Worldwide', url: 'https://befrienders.org' },
      ],
    });
  }

  if (anyMatch(harmfulPatterns, text)) {
    return json({
      verdict: 'block',
      reason:
        "This can't be posted — circles are a no-advice, no-harm space. If you're struggling, the SOS button has people who can help.",
    });
  }

  if (anyMatch(abusePatterns, text)) {
    return json({
      verdict: 'block',
      reason: 'This reads as abusive or harassing. Circles are kept gentle — please rephrase with care.',
    });
  }

  return json({ verdict: 'allow' });
}
