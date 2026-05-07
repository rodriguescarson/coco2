import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useTheme, spacing } from '../lib/theme';

export default function VoiceTherapy() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Anonymous voice</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={{ flex: 1, padding: spacing.lg }}>
        <Text variant="display">Speak it.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 4 }}>
          Anonymous voice rooms with trained listeners. No name, no recording, no judgment.
        </Text>

        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <View style={[styles.mic, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Ionicons name="mic-outline" size={56} color={colors.primary} />
          </View>
          <Text variant="caption" tone="dim" style={{ marginTop: spacing.lg, textAlign: 'center', maxWidth: 300 }}>
            Voice rooms are coming in the next build. For now, talk to Coco — it can listen to typed words, and we will ship voice with proper consent flows soon.
          </Text>
        </View>

        <Button label="Talk to Coco instead" icon="chatbubble-ellipses-outline" fullWidth size="lg" onPress={() => router.replace('/chat')} />
        <Card tone="muted" style={{ marginTop: spacing.md }}>
          <Text variant="caption" tone="dim">
            We are deliberately holding live voice features until we can guarantee end-to-end privacy and human listener vetting. Sign up for the early list once it ships.
          </Text>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  mic: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
