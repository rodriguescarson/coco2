import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Share, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView as ScrollView } from 'react-native-keyboard-controller';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing, radius } from '../lib/theme';
import { tap } from '../lib/haptics';
import { useScreenTracking, Analytics } from '../lib/analytics';
import {
  useReferral,
  claimReferral,
  normalizeCode,
  recognitionLine,
  getPendingReferral,
  clearPendingReferral,
} from '../lib/referrals';
import { buildInviteUrl } from '../lib/linking';

export default function Invite() {
  useScreenTracking('invite');
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ code?: string }>();
  const { code, stats, loading, available, reload } = useReferral();

  const [claimInput, setClaimInput] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimed, setClaimed] = useState(false);

  // Prefill the claim field from a deep-link param or a stashed pending code
  // (e.g. the link was opened before the app was installed).
  useEffect(() => {
    if (params.code) {
      setClaimInput(normalizeCode(String(params.code)));
      return;
    }
    getPendingReferral().then((pending) => {
      if (pending) setClaimInput(normalizeCode(pending));
    });
  }, [params.code]);

  const alreadyReferred = !!stats.referredBy || claimed;

  async function shareCode() {
    if (!code) return;
    const url = buildInviteUrl(code);
    try {
      void Analytics.track('invite_shared', { hasCode: true });
      await Share.share({
        message: `I've been using Coco, a quiet companion for your mind — mood check-ins, breathing, journaling, a gentle AI listener. Come find a calmer moment with me. Use my invite code ${code} or open: ${url}`,
      });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  }

  async function applyCode() {
    if (claiming) return;
    const normalized = normalizeCode(claimInput);
    if (!normalized) {
      setClaimError('Enter the 6-character code a friend shared with you.');
      return;
    }
    setClaiming(true);
    setClaimError(null);
    const result = await claimReferral(normalized);
    setClaiming(false);
    if (result.ok) {
      void Analytics.track('referral_claimed', {});
      await clearPendingReferral();
      tap('success');
      setClaimed(true);
      setClaimInput('');
      reload();
      return;
    }
    tap('warn');
    setClaimError(claimErrorText(result.reason));
    if (result.reason === 'already' || result.reason === 'self' || result.reason === 'invalid') {
      await clearPendingReferral();
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Invite a friend</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Text variant="display">Share a calmer moment.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 6 }}>
          If Coco has helped you, you can pass it on. No rewards to chase, no pressure — just a gentle nudge for someone who might need it.
        </Text>

        {!available ? (
          <Card tone="muted" style={{ marginTop: spacing.lg }}>
            <Text variant="bodyMedium">Inviting needs a connection</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
              You're offline or sync isn't set up yet. Everything else still works locally — try again when you're back online.
            </Text>
          </Card>
        ) : (
          <>
            {/* Recognition badge — the only "reward". Soft, never clinical. */}
            <Card tone="primary" style={{ marginTop: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="leaf" size={22} color={colors.primaryFg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="title" tone="primary">{stats.count}</Text>
                  <Text variant="caption" tone="primary" style={{ opacity: 0.9 }}>
                    {recognitionLine(stats.count)}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Your code + share */}
            <View style={{ marginTop: spacing.xl }}>
              <Text variant="micro" tone="dim" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>
                Your invite code
              </Text>
              <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text variant="display" style={{ letterSpacing: 6 }}>
                  {loading ? '••••••' : code ?? '——————'}
                </Text>
              </View>
              <Button
                label="Share invite"
                icon="share-outline"
                size="lg"
                fullWidth
                style={{ marginTop: spacing.md }}
                disabled={!code}
                onPress={shareCode}
              />
            </View>

            {/* Claim a friend's code */}
            <View style={{ marginTop: spacing.xl }}>
              <Text variant="micro" tone="dim" style={{ textTransform: 'uppercase', marginBottom: spacing.sm }}>
                Were you invited?
              </Text>
              {alreadyReferred ? (
                <Card tone="muted">
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Ionicons name="heart" size={18} color={colors.primary} />
                    <Text variant="bodyMedium" style={{ flex: 1 }}>
                      You joined through a friend's invite. Thanks for being here.
                    </Text>
                  </View>
                </Card>
              ) : (
                <>
                  <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <TextInput
                      value={claimInput}
                      onChangeText={(t) => setClaimInput(normalizeCode(t))}
                      placeholder="Enter a friend's code"
                      placeholderTextColor={colors.textFaint}
                      style={{ color: colors.text, fontSize: 16, letterSpacing: 3 }}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={6}
                      accessibilityLabel="Friend's invite code"
                    />
                  </View>
                  {claimError ? (
                    <Text variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>{claimError}</Text>
                  ) : null}
                  <Button
                    label="Apply code"
                    icon="checkmark"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    style={{ marginTop: spacing.md }}
                    loading={claiming}
                    onPress={applyCode}
                  />
                </>
              )}
            </View>

            <Card tone="muted" style={{ marginTop: spacing.xl }}>
              <Text variant="caption" tone="dim">
                Inviting only ever shares your code — never your moods, journals, check-ins, or anything you've written. It's a count, nothing more.
              </Text>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function claimErrorText(reason: 'self' | 'already' | 'invalid' | 'unavailable' | 'empty'): string {
  switch (reason) {
    case 'self':
      return "That's your own code — share it with a friend instead.";
    case 'already':
      return 'You already joined through an invite. Only one counts — but thank you.';
    case 'invalid':
      return "That code didn't match. Double-check the 6 characters and try again.";
    case 'empty':
      return 'Enter the 6-character code a friend shared with you.';
    default:
      return 'Network hiccup — check your connection and try again.';
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBox: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  input: {
    borderRadius: radius.lg,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
