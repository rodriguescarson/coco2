import { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, ActivityIndicator, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing } from '../lib/theme';
import { useScreenTracking, Analytics } from '../lib/analytics';
import { useVoiceRecorder } from '../lib/audio';
import { transcribeAudio } from '../lib/chat';
import { DataWrite } from '../lib/data-write';
import { tap } from '../lib/haptics';
import { useAiConsent } from '../lib/consent';
import { AiConsentGate } from '../components/AiConsentGate';

function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

type Phase = 'record' | 'transcribing' | 'review';

export default function VoiceTherapy() {
  useScreenTracking('voice-therapy');
  const { colors } = useTheme();
  const recorder = useVoiceRecorder();
  const { consented, loading: consentLoading, grant } = useAiConsent();

  const [phase, setPhase] = useState<Phase>('record');
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggleRecord() {
    if (recorder.isRecording) {
      tap('select');
      const uri = await recorder.stop();
      if (!uri) {
        setError("That recording didn't save. Mind trying again?");
        return;
      }
      setPhase('transcribing');
      setError(null);
      try {
        const text = await transcribeAudio(uri);
        if (!text) {
          setError("I couldn't hear any words in that. Try again, a little closer to the mic.");
          setPhase('record');
          recorder.reset();
          return;
        }
        setTranscript(text);
        setPhase('review');
        tap('success');
      } catch (e) {
        void Analytics.track('voice_transcribe_failed', { message: (e as Error).message?.slice(0, 120) });
        setError("I couldn't turn that into text just now. You can try again, or type it out below.");
        setTranscript('');
        setPhase('review');
        tap('warn');
      }
    } else {
      const ok = await recorder.start();
      if (ok) {
        void Analytics.track('voice_recording_started', {});
        tap('select');
      }
    }
  }

  async function saveAsJournal() {
    const body = transcript.trim();
    if (!body || saving) return;
    setSaving(true);
    await DataWrite.addJournal({
      id: `${Date.now()}`,
      prompt: 'Spoken out loud',
      body,
      at: Date.now(),
    });
    void Analytics.track('voice_journal_saved', { bodyLength: body.length });
    tap('success');
    router.back();
  }

  function talkToCoco() {
    const body = transcript.trim();
    void Analytics.track('voice_to_chat', { bodyLength: body.length });
    tap('select');
    router.replace({ pathname: '/chat', params: body ? { seed: body } : {} });
  }

  function recordAgain() {
    recorder.reset();
    setTranscript('');
    setError(null);
    setPhase('record');
    tap('tap');
  }

  // Voice notes are uploaded to the AI provider for transcription, so the same
  // first-use consent applies before any recording can be sent.
  if (consentLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </SafeAreaView>
    );
  }
  if (!consented) {
    return <AiConsentGate feature="Voice journaling" onAccept={grant} onDecline={() => router.back()} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Voice journaling</Text>
        <View style={{ width: 28 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: spacing.lg, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Text variant="display">Speak it.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>
          Say what's on your mind out loud. Coco turns it into a private journal entry — no name, transcribed and not stored as audio.
        </Text>

        {(phase === 'record' || phase === 'transcribing') && (
          <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: spacing.xl }}>
            {phase === 'transcribing' ? (
              <>
                <View style={[styles.mic, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
                <Text variant="bodyMedium" tone="dim" style={{ marginTop: spacing.lg }}>
                  Turning your words into text…
                </Text>
              </>
            ) : (
              <>
                <Pressable
                  onPress={toggleRecord}
                  accessibilityRole="button"
                  accessibilityLabel={recorder.isRecording ? 'Stop recording' : 'Start recording'}
                  style={[
                    styles.mic,
                    {
                      backgroundColor: recorder.isRecording ? colors.danger : colors.primary,
                      borderColor: recorder.isRecording ? colors.danger : colors.primary,
                    },
                  ]}
                >
                  <Ionicons name={recorder.isRecording ? 'stop' : 'mic'} size={56} color={recorder.isRecording ? '#fff' : colors.primaryFg} />
                </Pressable>
                <Text variant="title" style={{ marginTop: spacing.lg }}>
                  {recorder.isRecording ? formatDuration(recorder.durationMs) : 'Tap to record'}
                </Text>
                <Text variant="caption" tone="dim" style={{ marginTop: 4, textAlign: 'center', maxWidth: 300 }}>
                  {recorder.isRecording ? 'Tap again when you’re done.' : 'There’s no time limit. Take a breath and begin.'}
                </Text>
              </>
            )}
          </View>
        )}

        {phase === 'review' && (
          <View style={{ flex: 1, marginTop: spacing.lg }}>
            <Text variant="micro" tone="primary">YOUR ENTRY</Text>
            <TextInput
              value={transcript}
              onChangeText={setTranscript}
              placeholder="Edit your words, or type if the transcript missed anything…"
              placeholderTextColor={colors.textFaint}
              style={[styles.body, { color: colors.text }]}
              multiline
              autoFocus={!!transcript}
              textAlignVertical="top"
              accessibilityLabel="Transcript"
            />
            <Button
              label="Save to journal"
              icon="checkmark"
              fullWidth
              size="lg"
              disabled={!transcript.trim() || saving}
              loading={saving}
              onPress={saveAsJournal}
            />
            <Button
              label="Talk to Coco about this"
              icon="chatbubble-ellipses-outline"
              variant="secondary"
              fullWidth
              size="lg"
              style={{ marginTop: spacing.sm }}
              onPress={talkToCoco}
            />
            <Pressable onPress={recordAgain} style={{ alignSelf: 'center', marginTop: spacing.md }} hitSlop={8}>
              <Text variant="bodyMedium" tone="primary">Record again</Text>
            </Pressable>
          </View>
        )}

        {recorder.status === 'denied' && (
          <Card tone="danger" style={{ marginTop: spacing.md }}>
            <Text variant="bodyMedium">Microphone access is off</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
              To use voice journaling, allow microphone access for Coco in Settings. You can always type in the journal instead.
            </Text>
            <Button label="Open Settings" variant="ghost" size="sm" style={{ marginTop: spacing.sm }} onPress={() => Linking.openSettings()} />
          </Card>
        )}

        {error && (
          <Card tone="muted" style={{ marginTop: spacing.md }}>
            <Text variant="caption" tone="dim">{error}</Text>
          </Card>
        )}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  mic: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  body: { fontSize: 17, lineHeight: 24, marginTop: spacing.sm, minHeight: 200, marginBottom: spacing.lg },
});
