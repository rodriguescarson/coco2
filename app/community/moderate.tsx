import { useCallback, useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useScreenTracking } from '../../lib/analytics';
import { tap } from '../../lib/haptics';
import {
  OpenReport,
  currentUid,
  isModerator,
  listOpenReports,
  moderatorRemovePost,
  dismissReport,
} from '../../lib/community';

export default function Moderate() {
  useScreenTracking('community/moderate');
  const { colors } = useTheme();
  const moderator = isModerator();
  const uid = currentUid();

  const [reports, setReports] = useState<OpenReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!moderator) {
      setLoading(false);
      return;
    }
    setReports(await listOpenReports());
    setLoading(false);
  }, [moderator]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const remove = useCallback(async (r: OpenReport) => {
    setBusy(r.id);
    const ok = await moderatorRemovePost(r.postId);
    if (ok) await dismissReport(r.id);
    setReports((list) => list.filter((x) => x.id !== r.id));
    setBusy(null);
    tap(ok ? 'success' : 'warn');
  }, []);

  const dismiss = useCallback(async (r: OpenReport) => {
    setBusy(r.id);
    await dismissReport(r.id);
    setReports((list) => list.filter((x) => x.id !== r.id));
    setBusy(null);
    tap('select');
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Moderation</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Text variant="display">Reports.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          Review and act within 24 hours — that’s the App Store / Play requirement for user content.
        </Text>

        {/* Identity card — copy this UID into app.json extra.adminUids and firestore.rules isAdmin(). */}
        <Card tone="muted" style={{ marginTop: spacing.lg }}>
          <Text variant="micro" tone="dim">YOUR ACCOUNT UID</Text>
          <Text variant="bodyMedium" selectable style={{ marginTop: 4 }}>{uid ?? 'not signed in'}</Text>
          <Text variant="caption" tone="dim" style={{ marginTop: spacing.sm }}>
            {moderator
              ? 'You are a moderator on this build.'
              : 'To moderate: add this UID to app.json → extra.adminUids and to firestore.rules → isAdmin(), redeploy rules, and rebuild the app.'}
          </Text>
        </Card>

        {!moderator ? null : loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : reports.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: spacing.xl * 1.5 }}>
            <Ionicons name="checkmark-done-outline" size={40} color={colors.textFaint} />
            <Text variant="bodyMedium" tone="dim" style={{ marginTop: spacing.md }}>Queue is clear.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.lg }}>
            {reports.map((r) => (
              <Card key={r.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Pill label={r.circleId} />
                  {r.post?.removed ? <Pill label="already removed" tone="danger" selected /> : null}
                </View>
                <Text variant="body" style={{ marginTop: 8 }}>
                  {r.post ? r.post.body : '(post no longer exists)'}
                </Text>
                {r.post ? (
                  <Text variant="micro" tone="dim" style={{ marginTop: 6 }}>by {r.post.authorHandle}</Text>
                ) : null}
                <View style={[styles.reasonBox, { backgroundColor: colors.surfaceMuted }]}>
                  <Text variant="caption" tone="dim">Reason: {r.reason}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
                  <Button
                    label="Remove post"
                    variant="danger"
                    size="sm"
                    loading={busy === r.id}
                    disabled={!r.post || r.post.removed}
                    onPress={() => remove(r)}
                  />
                  <Button label="Dismiss" variant="ghost" size="sm" disabled={busy === r.id} onPress={() => dismiss(r)} />
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  reasonBox: { marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.md },
});
