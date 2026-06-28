// Inbound deep-link parsing for the invite loop.
//
// Supported shapes (scheme is `coco`, see app.json):
//   coco://invite/ABC123
//   coco://invite?code=ABC123
//   https://<anything>/invite/ABC123
//   any URL with ?code=ABC123 or ?ref=ABC123
//
// We deliberately keep this tiny and dependency-light: expo-router already
// handles routing, this just extracts a referral code from whatever URL opened
// the app so it can be stashed (survives install→signup).

import * as Linking from 'expo-linking';
import { normalizeCode } from './referrals';

// Pull a referral code out of an inbound URL, or null if there isn't one.
export function parseReferralCode(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: ReturnType<typeof Linking.parse>;
  try {
    parsed = Linking.parse(url);
  } catch {
    return null;
  }

  const qp = (parsed.queryParams ?? {}) as Record<string, string | string[] | undefined>;
  const first = (v: string | string[] | undefined): string | undefined =>
    Array.isArray(v) ? v[0] : v;

  // 1. Query params: ?code= / ?ref=
  const fromQuery = first(qp.code) ?? first(qp.ref);
  if (fromQuery) {
    const c = normalizeCode(fromQuery);
    if (c) return c;
  }

  // 2. Path: invite/<code>. Custom schemes parse inconsistently — for
  // `coco://invite/ABC123` the host may land in `hostname` ("invite") and the
  // code in `path` ("ABC123"), so fold both into one segment list before
  // looking for the `invite` marker.
  const path = (parsed.path ?? '').replace(/^\/+/, '');
  const segments = [parsed.hostname ?? '', ...path.split('/')].filter(Boolean);
  const inviteIdx = segments.findIndex((s) => s.toLowerCase() === 'invite');
  if (inviteIdx >= 0 && segments[inviteIdx + 1]) {
    const c = normalizeCode(segments[inviteIdx + 1]);
    if (c) return c;
  }

  return null;
}

// Build a shareable invite URL for a code, e.g. coco://invite/ABC123.
export function buildInviteUrl(code: string): string {
  try {
    return Linking.createURL(`invite/${code}`);
  } catch {
    return `coco://invite/${code}`;
  }
}
