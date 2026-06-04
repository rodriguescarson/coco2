import { useCallback, useRef, useState } from 'react';
import {
  View,
  TextInput,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useScreenTracking, Analytics } from '../../lib/analytics';
import { circleCatalog } from '../../lib/data';
import { tap } from '../../lib/haptics';
import {
  CommunityPost,
  fetchPosts,
  createPost,
  reportPost,
  blockAuthor,
  deleteOwnPost,
  hasAcceptedGuidelines,
} from '../../lib/community';

function relativeTime(ms: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

type Banner = { tone: 'danger' | 'muted'; text: string; resources?: { label: string; phone?: string; url?: string }[] };

export default function CircleFeed() {
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  useScreenTracking('community/circle');
  const { colors } = useTheme();
  const circle = circleCatalog.find((c) => c.id === circleId);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [banner, setBanner] = useState<Banner | null>(null);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!circleId) return;
    const [list, ok] = await Promise.all([fetchPosts(circleId), hasAcceptedGuidelines()]);
    setPosts(list);
    setAccepted(ok);
    setLoading(false);
  }, [circleId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || posting || !circleId) return;

    if (!accepted) {
      router.push(`/community/guidelines?circleId=${circleId}`);
      return;
    }

    setPosting(true);
    setBanner(null);
    tap('select');
    const res = await createPost(circleId, text);
    void Analytics.track('community_post_created', { ok: res.ok });

    if (res.ok) {
      setPosts((p) => [res.post, ...p]);
      setDraft('');
      tap('success');
      setTimeout(() => listRef.current?.scrollToOffset({ offset: 0, animated: true }), 50);
    } else if (res.verdict === 'crisis') {
      void Analytics.track('community_post_moderated', { verdict: 'crisis' });
      setBanner({ tone: 'danger', text: res.reason ?? 'Please reach out for support right now.', resources: res.resources });
      tap('warn');
    } else if (res.verdict === 'block') {
      void Analytics.track('community_post_moderated', { verdict: 'block' });
      setBanner({ tone: 'muted', text: res.reason ?? 'This can’t be posted here.' });
      tap('warn');
    } else {
      setBanner({ tone: 'muted', text: res.reason ?? 'Couldn’t post just now. Try again.' });
      tap('warn');
    }
    setPosting(false);
  }, [draft, posting, circleId, accepted]);

  const onPostActions = useCallback((post: CommunityPost) => {
    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (post.mine) {
      buttons.push({
        text: 'Delete my post',
        style: 'destructive',
        onPress: async () => {
          if (await deleteOwnPost(post)) {
            setPosts((p) => p.filter((x) => x.id !== post.id));
            tap('success');
          }
        },
      });
    } else {
      buttons.push({
        text: 'Report post',
        style: 'destructive',
        onPress: async () => {
          const ok = await reportPost(post, 'Reported from feed');
          void Analytics.track('community_post_reported', {});
          if (ok) setPosts((p) => p.filter((x) => x.id !== post.id));
          tap('success');
        },
      });
      buttons.push({
        text: 'Block this author',
        onPress: async () => {
          await blockAuthor(post.authorUid);
          void Analytics.track('community_author_blocked', {});
          setPosts((p) => p.filter((x) => x.authorUid !== post.authorUid));
          tap('success');
        },
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(post.mine ? 'Your post' : `From ${post.authorHandle}`, undefined, buttons);
  }, []);

  if (!circle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyMedium">Circle not found.</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: spacing.md }}>
          <Text variant="bodyMedium" tone="primary">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text variant="bodyMedium">{circle.name}</Text>
          <Text variant="micro" tone="dim">{circle.topic} · anonymous</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={posts}
            keyExtractor={(p) => p.id}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.md, gap: spacing.md, flexGrow: 1 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl * 2 }}>
                <Ionicons name="leaf-outline" size={40} color={colors.textFaint} />
                <Text variant="bodyMedium" tone="dim" style={{ marginTop: spacing.md }}>Be the first to share here.</Text>
                <Text variant="caption" tone="dim" style={{ marginTop: 4, textAlign: 'center', maxWidth: 260 }}>
                  {circle.description}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Card>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text variant="bodyMedium">{item.authorHandle}</Text>
                    {item.mine ? <Pill label="You" tone="primary" /> : null}
                  </View>
                  <Pressable onPress={() => onPostActions(item)} accessibilityLabel="Post actions" hitSlop={10}>
                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.textFaint} />
                  </Pressable>
                </View>
                <Text variant="body" style={{ marginTop: 6 }}>{item.body}</Text>
                <Text variant="micro" tone="dim" style={{ marginTop: 8 }}>{relativeTime(item.createdAtMs)}</Text>
              </Card>
            )}
          />
        )}

        {banner ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <Card tone={banner.tone === 'danger' ? 'danger' : 'muted'}>
              <Text variant="caption" tone={banner.tone === 'danger' ? 'danger' : 'dim'}>{banner.text}</Text>
              {banner.resources?.length ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }}>
                  {banner.resources.map((r) => (
                    <Pill
                      key={r.label}
                      label={r.label}
                      tone="danger"
                      selected
                      onPress={() => {
                        if (r.url === 'coco://sos') router.push('/sos');
                        else if (r.phone) Linking.openURL(`tel:${r.phone}`);
                        else if (r.url) Linking.openURL(r.url);
                      }}
                    />
                  ))}
                </View>
              ) : null}
            </Card>
          </View>
        ) : null}

        <View style={[styles.composer, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={accepted ? 'Share what’s on your mind…' : 'Tap to read the circle agreement first…'}
            placeholderTextColor={colors.textFaint}
            style={[styles.input, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border }]}
            multiline
            maxLength={1000}
            accessibilityLabel="Write a post"
          />
          <Pressable
            onPress={send}
            disabled={posting || !draft.trim()}
            accessibilityLabel="Post"
            style={[styles.send, { backgroundColor: draft.trim() && !posting ? colors.primary : colors.surfaceMuted }]}
          >
            {posting ? (
              <ActivityIndicator size="small" color={colors.primaryFg} />
            ) : (
              <Ionicons name="arrow-up" size={20} color={draft.trim() ? colors.primaryFg : colors.textFaint} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: StyleSheet.hairlineWidth },
  input: { flex: 1, maxHeight: 120, minHeight: 44, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: spacing.md, paddingTop: 12, paddingBottom: 12, fontSize: 16 },
  send: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
