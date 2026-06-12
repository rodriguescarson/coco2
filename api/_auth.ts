// Shared auth + rate-limit helper for the Vercel EDGE Groq-proxy endpoints
// (api/chat.ts, api/moderate.ts, api/transcribe.ts).
//
// Why this exists: those endpoints proxy a PAID Groq key. Left unauthenticated
// they are open to cost-abuse / financial DoS from the public internet. This
// helper adds Firebase ID-token verification (signature + iss/aud claims) and a
// soft per-identity rate limit.
//
// Files prefixed with `_` are NOT routed as endpoints by Vercel, so this module
// is import-only.
//
// Edge runtime: no Node / firebase-admin available, so we verify the Firebase
// ID token directly with `jose` against Google's public x509 certs.

import { importX509, jwtVerify, decodeProtectedHeader } from 'jose';

// Firebase project that mints the tokens. Default mirrors app.json /
// google-services.json ("coco-sih"); override with FIREBASE_PROJECT_ID.
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'coco-sih';

// Google's public x509 certificates for Firebase ID tokens (securetoken).
const CERT_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

// Monitor mode by default. When "true", missing/invalid tokens are rejected
// with 401. When false/unset, we verify a token IF present and attach the uid,
// but ALLOW requests with missing/invalid tokens (logging a warning) so that
// already-installed clients that don't yet send a token keep working. This lets
// the token-sending client ship first; flip ENFORCE_AUTH=true later.
function enforcing(): boolean {
  return process.env.ENFORCE_AUTH === 'true';
}

// --- Firebase ID-token verification -----------------------------------------

type CertMap = Record<string, string>;
let certCache: { keys: CertMap; expiresAt: number } | null = null;

// Fetch and cache Google's signing certs, honouring their Cache-Control max-age.
async function getCerts(): Promise<CertMap> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) return certCache.keys;

  const res = await fetch(CERT_URL);
  if (!res.ok) throw new Error(`cert fetch failed: ${res.status}`);
  const keys = (await res.json()) as CertMap;

  const cacheControl = res.headers.get('cache-control') || '';
  const maxAge = /max-age=(\d+)/.exec(cacheControl);
  // Default to 1h if the header is missing; Google typically sends ~6h.
  const ttlMs = (maxAge ? parseInt(maxAge[1], 10) : 3600) * 1000;
  certCache = { keys, expiresAt: now + ttlMs };
  return keys;
}

// Verify signature + iss/aud (and exp/iat via jose). Returns the Firebase uid.
async function verifyFirebaseToken(token: string): Promise<string> {
  const header = decodeProtectedHeader(token);
  const kid = header.kid;
  if (!kid) throw new Error('token missing kid');

  const certs = await getCerts();
  const cert = certs[kid];
  if (!cert) throw new Error('no matching signing cert for kid');

  const key = await importX509(cert, 'RS256');
  const { payload } = await jwtVerify(token, key, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });

  const uid = (payload.sub || (payload as { user_id?: string }).user_id) as
    | string
    | undefined;
  if (!uid) throw new Error('token missing subject');
  return uid;
}

// --- Soft per-identity rate limit -------------------------------------------
//
// Best-effort in-memory token bucket keyed by uid-or-IP. NOTE: edge runs many
// isolates, so this is per-instance and resets on cold start — it is a soft cap
// to blunt obvious abuse, NOT a durable guarantee. Durable rate limiting needs
// Vercel Firewall or an external store (e.g. Upstash Redis).

const RATE_LIMIT = Number(process.env.RATE_LIMIT_PER_MIN || 30);
const buckets = new Map<string, { tokens: number; updated: number }>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const refillPerMs = RATE_LIMIT / 60_000;
  let b = buckets.get(key);
  if (!b) {
    b = { tokens: RATE_LIMIT, updated: now };
    buckets.set(key, b);
  }
  b.tokens = Math.min(RATE_LIMIT, b.tokens + (now - b.updated) * refillPerMs);
  b.updated = now;
  if (b.tokens < 1) return false;
  b.tokens -= 1;
  return true;
}

function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

// --- Public guard -----------------------------------------------------------

type GuardResult = {
  // The verified Firebase uid, or null when no/invalid token was presented in
  // monitor mode. Endpoints may use this for logging/keying.
  uid: string | null;
  // When set, the caller must return this Response immediately (401 or 429).
  rejection?: Response;
};

function deny(
  status: number,
  error: string,
  cors: Record<string, string>,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'content-type': 'application/json', ...cors, ...extraHeaders },
  });
}

// guard() runs auth + rate limiting for an edge handler. Call it right after the
// method check. If `rejection` is returned, return it as the response; otherwise
// proceed with the (possibly null) uid.
export async function guard(
  req: Request,
  cors: Record<string, string>,
): Promise<GuardResult> {
  const enforce = enforcing();

  const authHeader = req.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader);
  const token = match?.[1];

  let uid: string | null = null;

  if (!token) {
    if (enforce) {
      return { uid: null, rejection: deny(401, 'Authentication required', cors) };
    }
    console.warn('[auth] missing token — monitor mode, allowing request');
  } else {
    try {
      uid = await verifyFirebaseToken(token);
    } catch (err) {
      if (enforce) {
        return { uid: null, rejection: deny(401, 'Invalid or expired token', cors) };
      }
      console.warn(
        '[auth] invalid token — monitor mode, allowing request:',
        (err as Error).message,
      );
    }
  }

  // Soft rate limit applies whether or not auth is enforced.
  const key = uid ? `uid:${uid}` : `ip:${clientIp(req)}`;
  if (!rateLimitOk(key)) {
    return {
      uid,
      rejection: deny(429, 'Too many requests — slow down a moment.', cors, {
        'retry-after': '60',
      }),
    };
  }

  return { uid };
}
