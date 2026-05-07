import { useEffect, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { Sync } from '../lib/sync';
import { useAppOpen } from '../lib/analytics';

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

  return <>{children}</>;
}
