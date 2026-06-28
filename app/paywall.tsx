import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { PurchasesPackage } from 'react-native-purchases';

import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { useEntitlement } from '../lib/useEntitlement';
import { getOfferingPackages, purchase, restorePurchases } from '../lib/purchases';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL, AUTO_RENEW_DISCLOSURE } from '../lib/legal';
import { tap } from '../lib/haptics';
import { useScreenTracking } from '../lib/analytics';

/**
 * Custom, fully in-app Coco Pro paywall. Pulls live packages (and prices) from
 * RevenueCat when available; falls back to known display prices so the screen
 * always renders a complete offer (Expo Go, or before the store products finish
 * propagating). Purchasing needs the native SDK + live products — handled
 * gracefully when absent. Crisis/SOS features are never gated.
 */

// Fallback display prices used only when live packages haven't loaded.
const FALLBACK = { monthly: 4.99, yearly: 29.99 };

type PlanKey = 'monthly' | 'yearly';

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'chatbubbles-outline', text: 'Unlimited conversations with Coco, your AI listener' },
  { icon: 'moon-outline', text: 'The full library of meditations & sleep sounds' },
  { icon: 'leaf-outline', text: 'New calming content as it lands, first' },
  { icon: 'heart-outline', text: 'Keep Coco free and ad-free for everyone who needs it' },
];

export default function Paywall() {
  useScreenTracking('paywall');
  const { colors } = useTheme();
  const { isPro } = useEntitlement();

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PlanKey>('yearly');
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    let active = true;
    void getOfferingPackages().then((pkgs) => {
      if (active) setPackages(pkgs);
    });
    return () => {
      active = false;
    };
  }, []);

  const monthlyPkg = useMemo(
    () => packages.find((p) => p.identifier === '$rc_monthly'),
    [packages],
  );
  const yearlyPkg = useMemo(
    () => packages.find((p) => p.identifier === '$rc_annual'),
    [packages],
  );

  const monthlyNum = monthlyPkg?.product.price ?? FALLBACK.monthly;
  const yearlyNum = yearlyPkg?.product.price ?? FALLBACK.yearly;
  const monthlyStr = monthlyPkg?.product.priceString ?? `$${FALLBACK.monthly}`;
  const yearlyStr = yearlyPkg?.product.priceString ?? `$${FALLBACK.yearly}`;
  const savePct = Math.max(0, Math.round((1 - yearlyNum / (monthlyNum * 12)) * 100));

  async function buy() {
    const pkg = selected === 'yearly' ? yearlyPkg : monthlyPkg;
    if (!pkg) {
      Alert.alert('Coco Pro', "Plans aren't available right now. Please try again in a moment.");
      return;
    }
    setBuying(true);
    tap('select');
    const result = await purchase(pkg);
    setBuying(false);
    if (result === 'purchased') {
      tap('success');
      router.back();
    } else if (result === 'error') {
      Alert.alert('Coco Pro', "That didn't go through. No charge was made — please try again.");
    }
    // "cancelled" → stay quiet
  }

  async function restore() {
    setRestoring(true);
    try {
      const ok = await restorePurchases();
      if (ok) {
        tap('success');
        router.back();
      } else {
        Alert.alert('Restore purchases', 'We couldn\'t find an active subscription to restore.');
      }
    } catch {
      Alert.alert('Restore purchases', 'Something went wrong restoring. Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityLabel="Close"
          accessibilityRole="button"
          style={styles.close}
        >
          <Ionicons name="close" size={26} color={colors.textFaint} />
        </Pressable>

        {/* Hero */}
        <View style={{ alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg }}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="sparkles" size={30} color={colors.primary} />
          </View>
          <Text variant="display" align="center">Coco Pro</Text>
          <Text variant="body" tone="dim" align="center">
            {isPro ? "You're a Coco Pro — thank you for keeping this calm." : 'A little more space to breathe, whenever you need it.'}
          </Text>
        </View>

        {isPro ? (
          <Button label="Done" fullWidth onPress={() => router.back()} />
        ) : (
          <>
            {/* Features */}
            <View style={{ gap: spacing.md, marginVertical: spacing.md }}>
              {FEATURES.map((f) => (
                <View key={f.icon} style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={f.icon} size={18} color={colors.primary} />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>{f.text}</Text>
                </View>
              ))}
            </View>

            {/* Plans */}
            <View style={{ gap: spacing.md, marginTop: spacing.sm }}>
              <PlanCard
                label="Yearly"
                priceLine={`${yearlyStr} / yr`}
                sub="Billed once a year"
                badge={savePct > 0 ? `Save ${savePct}%` : 'Best value'}
                selected={selected === 'yearly'}
                onPress={() => setSelected('yearly')}
              />
              <PlanCard
                label="Monthly"
                priceLine={`${monthlyStr} / mo`}
                selected={selected === 'monthly'}
                onPress={() => setSelected('monthly')}
              />
            </View>

            <Text variant="caption" tone="faint" align="center" style={{ marginTop: spacing.md, lineHeight: 18 }}>
              Crisis support and SOS resources are always free, with or without Pro.
            </Text>

            <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
              <Button
                label="Continue"
                fullWidth
                loading={buying}
                disabled={restoring}
                onPress={buy}
              />
              <View style={styles.footerLinks}>
                <Pressable onPress={restore} hitSlop={8} disabled={restoring}>
                  <Text variant="caption" tone="dim">Restore</Text>
                </Pressable>
                <Text variant="caption" tone="faint">·</Text>
                <Pressable onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL).catch(() => {})} hitSlop={8}>
                  <Text variant="caption" tone="dim">Terms</Text>
                </Pressable>
                <Text variant="caption" tone="faint">·</Text>
                <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL).catch(() => {})} hitSlop={8}>
                  <Text variant="caption" tone="dim">Privacy</Text>
                </Pressable>
              </View>
              <Text variant="micro" tone="faint" align="center" style={{ lineHeight: 16 }}>
                {AUTO_RENEW_DISCLOSURE}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({
  label,
  priceLine,
  sub,
  badge,
  selected,
  onPress,
}: {
  label: string;
  priceLine: string;
  sub?: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }}>
      <View
        style={[
          styles.plan,
          {
            borderColor: selected ? colors.primary : colors.border,
            backgroundColor: selected ? colors.primarySoft : colors.surface,
          },
        ]}
      >
        <Ionicons
          name={selected ? 'radio-button-on' : 'radio-button-off'}
          size={22}
          color={selected ? colors.primary : colors.textFaint}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Text variant="bodyMedium">{label}</Text>
            {badge ? (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text variant="micro" tone="onPrimary">{badge}</Text>
              </View>
            ) : null}
          </View>
          {sub ? <Text variant="caption" tone="dim">{sub}</Text> : null}
        </View>
        <Text variant="bodyMedium" tone={selected ? 'primary' : 'default'}>{priceLine}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  close: { alignSelf: 'flex-end', padding: 4, marginBottom: spacing.sm },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderRadius: radius.lg,
  },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
});
