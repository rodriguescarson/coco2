import { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, FlatList, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { useTheme, spacing, radius } from '../lib/theme';
import { Storage, UserProfile } from '../lib/storage';
import { sendChat, detectCrisis, newId, ChatMessage } from '../lib/chat';
import { tap } from '../lib/haptics';

const SUGGESTED = [
  'I can\'t sleep',
  'I\'m feeling anxious',
  'I had a hard day',
  'Help me process something',
];

export default function Chat() {
  const { colors } = useTheme();
  const [user, setUser] = useState<UserProfile>({});
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    Storage.getUser().then(setUser);
    Storage.getChat().then((stored) => {
      if (stored.length > 0) {
        setMessages(stored as ChatMessage[]);
      } else {
        setMessages([
          {
            id: newId(),
            role: 'assistant',
            text: "Hi, I'm Coco. I'm here to listen — no judgment, no advice unless you want it. What's on your mind?",
            at: Date.now(),
          },
        ]);
      }
    });
  }, []);

  useEffect(() => {
    Storage.setChat(messages);
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;
      setError(null);
      const userMsg: ChatMessage = { id: newId(), role: 'user', text: trimmed, at: Date.now() };
      const next = [...messages, userMsg];
      setMessages(next);
      setDraft('');
      setSending(true);
      tap('select');

      const clientCrisis = detectCrisis(trimmed);
      try {
        const res = await sendChat({
          messages: next.map((m) => ({ role: m.role, content: m.text })),
          user: { name: user.name },
        });
        const assistant: ChatMessage = {
          id: newId(),
          role: 'assistant',
          text: res.reply,
          at: Date.now(),
          meta: { crisisDetected: !!res.crisisDetected || clientCrisis },
        };
        setMessages((m) => [...m, assistant]);
        tap('tap');
      } catch (e) {
        const fallback =
          clientCrisis
            ? "I'm here. I noticed something serious in what you said. I'm having trouble reaching the network — please open SOS for hotlines that are available right now."
            : "I couldn't reach the server. Try again in a moment, or use a tool from the Tools tab while we wait.";
        setMessages((m) => [
          ...m,
          { id: newId(), role: 'assistant', text: fallback, at: Date.now(), meta: { crisisDetected: clientCrisis } },
        ]);
        setError((e as Error).message);
        tap('warn');
      } finally {
        setSending(false);
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
      }
    },
    [messages, sending, user.name],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="chevron-down" size={28} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text variant="micro" tone="dim">AI COMPANION</Text>
          <Text variant="bodyMedium">Coco</Text>
        </View>
        <Pressable
          onPress={() => router.push('/sos')}
          accessibilityLabel="Open SOS"
          hitSlop={12}
          style={[styles.sosBtn, { backgroundColor: colors.dangerSoft }]}
        >
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text variant="micro" style={{ color: colors.danger, marginLeft: 4, fontWeight: '700' }}>SOS</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: 24 }}
          renderItem={({ item }) => <Bubble msg={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={sending ? <TypingDots /> : null}
        />

        {messages.length <= 1 && (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {SUGGESTED.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => send(s)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.chip,
                    { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text variant="caption" style={{ fontWeight: '500' }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {error ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingBottom: 8 }}>
            <Text variant="caption" tone="danger">Network hiccup. {error}</Text>
          </View>
        ) : null}

        <View style={[styles.inputRow, { backgroundColor: colors.bgElevated, borderTopColor: colors.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Tell Coco what's going on..."
              placeholderTextColor={colors.textFaint}
              style={[styles.input, { color: colors.text }]}
              multiline
              maxLength={2000}
              accessibilityLabel="Message input"
              onSubmitEditing={() => send(draft)}
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            disabled={!draft.trim() || sending}
            onPress={() => send(draft)}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: draft.trim() ? colors.primary : colors.surfaceMuted,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-up" size={20} color={draft.trim() ? colors.primaryFg : colors.textFaint} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ msg }: { msg: ChatMessage }) {
  const { colors } = useTheme();
  const isUser = msg.role === 'user';
  return (
    <View style={{ marginBottom: spacing.md, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
      <View
        accessible
        accessibilityLabel={`${isUser ? 'You' : 'Coco'} said: ${msg.text}`}
        style={[
          styles.bubble,
          {
            backgroundColor: isUser ? colors.primary : colors.surface,
            borderColor: isUser ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={{ color: isUser ? colors.primaryFg : colors.text, fontSize: 16, lineHeight: 22 }}>{msg.text}</Text>
      </View>
      {msg.meta?.crisisDetected && !isUser ? (
        <Pressable
          onPress={() => router.push('/sos')}
          accessibilityRole="button"
          accessibilityLabel="Open SOS resources"
          style={[styles.crisisBanner, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}
        >
          <Ionicons name="call" size={14} color={colors.danger} />
          <Text variant="caption" style={{ color: colors.danger, fontWeight: '700', marginLeft: 6 }}>
            Get support now
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TypingDots() {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 4, padding: 8 }}>
      <View style={[styles.dot, { backgroundColor: colors.textFaint }]} />
      <View style={[styles.dot, { backgroundColor: colors.textFaint, opacity: 0.7 }]} />
      <View style={[styles.dot, { backgroundColor: colors.textFaint, opacity: 0.4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  sosBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  bubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.lg,
    borderTopRightRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '85%',
  },
  crisisBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  inputWrap: {
    flex: 1,
    minHeight: 44,
    maxHeight: 140,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  input: { fontSize: 16, padding: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

