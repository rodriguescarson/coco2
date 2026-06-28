import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import type { CustomerInfo, PurchasesPackage } from 'react-native-purchases';

/**
 * RevenueCat wrapper. Everything native is dynamically imported and guarded so
 * the bundle stays Expo-Go-safe — when the SDK is unavailable (Expo Go) or
 * unconfigured (no API key), the app degrades to the free tier instead of
 * crashing. Real purchases require a dev/native build with the RevenueCat keys
 * + an offering set up in the dashboard.
 */

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// RevenueCat entitlement identifier. Must match the entitlement's identifier in
// the RC dashboard (Project → Entitlements). For Coco the entitlement is
// "Coco Pro" and is immutable, so we mirror it here.
export const ENTITLEMENT_ID = 'Coco Pro';

/**
 * Resolve the API key. Prefer the platform-specific key when present; fall back
 * to a single shared/test key so a `test_…` v2 key works for either platform
 * without duplication.
 */
function resolveApiKey(): string | undefined {
  const ios = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
  const android = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  const shared = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  let key: string | undefined;
  if (Platform.OS === 'ios') key = ios || shared;
  else if (Platform.OS === 'android') key = android || shared;
  else key = shared;
  // A `test_…` key in a release build makes the RC SDK force-close the app
  // ("Wrong API Key" dialog). Drop the key instead so the app degrades to the
  // free tier rather than crashing in production.
  if (!__DEV__ && key?.startsWith('test_')) return undefined;
  return key;
}

const apiKey = resolveApiKey();

export function isPurchasesAvailable(): boolean {
  return !isExpoGo && !!apiKey;
}

let configured = false;
let currentUserId: string | undefined;

async function loadSdk() {
  if (!isPurchasesAvailable()) return null;
  return (await import('react-native-purchases')).default;
}

async function loadUiSdk() {
  if (!isPurchasesAvailable()) return null;
  return (await import('react-native-purchases-ui')).default;
}

/** Configure on first use, then keep the appUserID in sync with Firebase. */
async function ensureConfigured(userId?: string) {
  const Purchases = await loadSdk();
  if (!Purchases) return null;
  if (!configured) {
    Purchases.configure({ apiKey: apiKey!, appUserID: userId ?? null });
    configured = true;
    currentUserId = userId ?? undefined;
  } else if (userId && userId !== currentUserId) {
    await Purchases.logIn(userId).catch(() => {});
    currentUserId = userId;
  }
  return Purchases;
}

// ---- public API ----

export async function checkIsPro(userId?: string): Promise<boolean> {
  const Purchases = await ensureConfigured(userId);
  if (!Purchases) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

export async function getOfferingPackages(): Promise<PurchasesPackage[]> {
  const Purchases = await ensureConfigured();
  if (!Purchases) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

export type PurchaseResult = 'purchased' | 'cancelled' | 'error';

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  const Purchases = await ensureConfigured();
  if (!Purchases) return 'error';
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined'
      ? 'purchased'
      : 'error';
  } catch (e) {
    // Distinguish a deliberate user cancel from a real failure so the UI can
    // stay quiet on cancel but surface genuine errors.
    if (e && typeof e === 'object' && (e as { userCancelled?: boolean }).userCancelled)
      return 'cancelled';
    return 'error';
  }
}

export async function restorePurchases(): Promise<boolean> {
  const Purchases = await ensureConfigured();
  if (!Purchases) return false;
  try {
    const info = await Purchases.restorePurchases();
    return typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
  } catch {
    return false;
  }
}

/** Link the RevenueCat customer to a real Firebase uid (after sign-in). */
export async function loginPurchases(userId: string): Promise<void> {
  const Purchases = await ensureConfigured(userId);
  if (!Purchases) return;
}

/** Reset RC customer back to an anonymous id (on sign-out). */
export async function logoutPurchases(): Promise<void> {
  const Purchases = await loadSdk();
  if (!Purchases || !configured) return;
  try {
    await Purchases.logOut();
    currentUserId = undefined;
  } catch {
    // ignore — already anonymous
  }
}

// ---- listener so the UI re-renders the moment RC notices an entitlement change ----

type Unsubscribe = () => void;

export async function onCustomerInfoUpdate(
  cb: (info: CustomerInfo) => void,
): Promise<Unsubscribe> {
  const Purchases = await ensureConfigured();
  if (!Purchases) return () => {};
  Purchases.addCustomerInfoUpdateListener(cb);
  return () => Purchases.removeCustomerInfoUpdateListener(cb);
}

// ---- RevenueCatUI: hosted Paywall + Customer Center ----

/**
 * Present the hosted paywall as a modal. Returns true if the user is now
 * entitled. Use the custom in-app `app/paywall.tsx` screen when you want full
 * control over the surrounding UI; this is for quick upsell entry points.
 */
export async function presentPaywall(opts?: {
  requiredEntitlementIdentifier?: string;
}): Promise<boolean> {
  const RevenueCatUI = await loadUiSdk();
  if (!RevenueCatUI) return false;
  const entitlement = opts?.requiredEntitlementIdentifier ?? ENTITLEMENT_ID;
  // presentPaywallIfNeeded only shows the paywall when the entitlement is
  // missing — exactly the gate we want for upsell entry points.
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: entitlement,
  });
  // PAYWALL_RESULT.PURCHASED | .RESTORED → entitled, otherwise no change.
  return result === 'PURCHASED' || result === 'RESTORED';
}

/** Open the RevenueCat Customer Center (manage / cancel / restore / FAQ). */
export async function presentCustomerCenter(): Promise<void> {
  const RevenueCatUI = await loadUiSdk();
  if (!RevenueCatUI) return;
  await RevenueCatUI.presentCustomerCenter();
}
