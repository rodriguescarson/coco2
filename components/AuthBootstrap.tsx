import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useAuth } from '../lib/auth';
import { Sync } from '../lib/sync';
import { useAppOpen } from '../lib/analytics';
import { parseReferralCode } from '../lib/linking';
import { stashPendingReferral, claimPendingReferral } from '../lib/referrals';

// Bootstraps anonymous auth on app start and runs an initial cloud pull/push
// once the user is known. Render this once near the root.
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { user, available } = useAuth();
  const lastUid = useRef<string | null>(null);
  useAppOpen();

  useEffect(() => {
    if (!available || !user) return;
    if (lastUid.current === user.uid) return;
    lastUid.current = user.uid;
    Sync.pullAll().then(() => Sync.pushBacklog()).catch(() => {});
  }, [available, user]);

  // Invite deep links. Stash any incoming code immediately (so it survives an
  // install→signup gap) and gently route to the opt-in Invite screen — we never
  // silently attribute; the user taps "Apply" there.
  useEffect(() => {
    let mounted = true;
    const handle = async (url: string | null) => {
      const code = parseReferralCode(url);
      if (!code || !mounted) return;
      await stashPendingReferral(code);
      // Defer navigation a beat so the router is mounted on cold start.
      setTimeout(() => {
        if (mounted) router.push({ pathname: '/invite', params: { code } });
      }, 350);
    };
    Linking.getInitialURL().then(handle).catch(() => {});
    const sub = Linking.addEventListener('url', (e) => handle(e.url));
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return <>{children}</>;
}
