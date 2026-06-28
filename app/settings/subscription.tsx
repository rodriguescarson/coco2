import { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Alert, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useEntitlement } from '../../lib/useEntitlement';
import {
  isPurchasesAvailable,
  presentCustomerCenter,
  restorePurchases,
} from '../../lib/purchases';
import { useScreenTracking } from '../../lib/analytics';

/** OS-level subscription management page (where the user can cancel). */
const STORE_SUBSCRIPTIONS_URL =
  Platform.OS === 'android'
    ? 'https://play.google.com/store/account/subscriptions'
    : 'https://apps.apple.com/account/subscriptions';

/**
 * Coco Pro management. Works in every environment:
 *  - On a native build the RevenueCat Customer Center (cancel / refund /
 *    support) is presented when available.
 *  - Otherwise (incl. Expo Go) we deep-link to the OS subscription settings —
 *    also Apple's required "manage your subscription" destination.
 * Restore is always offered so a returning user can recover their entitlement.
 */
export default function Subscription() {
  useScreenTracking('subscription');
  const { colors } = useTheme();
  const { isPro } = useEntitlement();
  const [restoring, setRestoring] = useState(false);

  async function manage() {
    if (isPurchasesAvailable()) {
      await presentCustomerCenter();
      return;
    }
    try {
      await Linking.openURL(STORE_SUBSCRIPTIONS_URL);
    } catch {
      Alert.alert('Coco Pro', "We couldn't open your store subscription settings.");
    }
  }

  async function restore() {
    setRestoring(true);
    try {
      const ok = await restorePurchases();
      Alert.alert(
        'Restore purchases',
        ok ? 'Your Coco Pro subscription is active again.' : "We couldn't find an active subscription to restore.",
      );
    } catch {
      Alert.alert('Restore purchases', 'Something went wrong restoring. Please try again.');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Coco Pro</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md }}>
        {/* Status */}
        <View style={[styles.status, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <Ionicons name={isPro ? 'sparkles' : 'sparkles-outline'} size={26} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text variant="bodyMedium" tone="primary" style={{ fontWeight: '700' }}>
              {isPro ? 'Coco Pro is active' : "You're on the free plan"}
            </Text>
            <Text variant="caption" tone="primary" style={{ opacity: 0.85, marginTop: 2 }}>
              {isPro
                ? 'Unlimited AI listener and the full calming library.'
                : 'Unlock unlimited conversations and every meditation.'}
            </Text>
          </View>
        </View>

        {!isPro && (
          <Button label="See Coco Pro" fullWidth icon="sparkles" onPress={() => router.push('/paywall')} />
        )}

        {/* Manage / cancel */}
        <Pressable onPress={manage} accessibilityRole="button" accessibilityLabel="Manage subscription">
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="card-outline" size={22} color={colors.text} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Manage subscription</Text>
                <Text variant="caption" tone="dim">Update, cancel, or get a refund</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.textFaint} />
            </View>
          </Card>
        </Pressable>

        {/* Restore */}
        <Pressable onPress={restore} disabled={restoring} accessibilityRole="button" accessibilityLabel="Restore purchases">
          <Card style={{ opacity: restoring ? 0.6 : 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="refresh-outline" size={22} color={colors.text} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium">Restore purchases</Text>
                <Text variant="caption" tone="dim">Already subscribed? Bring it back here</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
            </View>
          </Card>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
