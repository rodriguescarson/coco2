import { useCallback, useEffect, useState } from 'react';

import { useAuth } from './auth';
import {
  ENTITLEMENT_ID,
  checkIsPro,
  isPurchasesAvailable,
  onCustomerInfoUpdate,
} from './purchases';

/**
 * Dev-only Pro override. Lets you exercise Pro-gated features (unlimited AI
 * listener, premium meditations) in Expo Go / a dev build where the RevenueCat
 * SDK is absent and `isPro` would otherwise always be false. Double-gated: only
 * when running a dev build AND the env flag is "1". Never true in a production
 * build (`__DEV__` is false).
 */
const FORCE_PRO = __DEV__ && process.env.EXPO_PUBLIC_FORCE_PRO === '1';

/**
 * Whether the user holds the "Coco Pro" entitlement. Free (false) when the SDK
 * is unavailable. Subscribes to RevenueCat's customer-info updates so a
 * successful purchase flips `isPro` without a manual refetch.
 *
 * The appUserID is keyed to Coco's Firebase uid (anonymous or signed-in), so a
 * purchase follows the user — and survives an anonymous → email/Google/Apple
 * upgrade, which keeps the same Firebase uid.
 */
export function useEntitlement() {
  const { user } = useAuth();
  const userId = user?.uid;

  const [isProState, setIsProState] = useState(false);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    const pro = await checkIsPro(userId);
    setIsProState(pro);
    setLoading(false);
    return pro;
  }, [userId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const pro = await checkIsPro(userId);
      if (active) {
        setIsProState(pro);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    let cancel: (() => void) | undefined;
    let unmounted = false;
    void (async () => {
      const fn = await onCustomerInfoUpdate((info) => {
        const next =
          typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setIsProState(next);
      });
      // If we unmounted before the listener registered, tear it down now —
      // otherwise the returned cleanup runs before `cancel` is assigned and the
      // listener leaks.
      if (unmounted) fn();
      else cancel = fn;
    })();
    return () => {
      unmounted = true;
      cancel?.();
    };
  }, [userId]);

  return {
    isPro: FORCE_PRO || isProState,
    loading,
    available: isPurchasesAvailable(),
    refetch,
  };
}
