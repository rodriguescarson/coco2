import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { useTheme, spacing } from '../lib/theme';
import { groundingSteps } from '../lib/data';
import { tap } from '../lib/haptics';
import { useScreenTracking, Analytics } from '../lib/analytics';

export default function Grounding() {
  useScreenTracking('grounding');
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const total = groundingSteps.length;
  const startedAt = useRef(Date.now());
  useEffect(() => { void Analytics.track('grounding_started'); }, []);

  const current = groundingSteps[step];
  const remaining = 5 - step;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Grounding 5-4-3-2-1</Text>
        <Text variant="micro" tone="dim">{step + 1}/{total}</Text>
      </View>

      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'center', alignItems: 'center' }}>
        <View style={[styles.numberRing, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]}>
          <Text variant="display" tone="primary" style={{ fontSize: 64 }}>{remaining}</Text>
        </View>
        <Text variant="title" style={{ marginTop: spacing.xxl, textAlign: 'center' }}>{current.sense}</Text>
        <Text variant="body" tone="dim" style={{ marginTop: spacing.md, textAlign: 'center', maxWidth: 320 }}>
          {current.prompt}
        </Text>
      </View>

      <View style={{ padding: spacing.lg }}>
        <Button
          label={step === total - 1 ? 'Finish' : 'Next'}
          fullWidth
          size="lg"
          iconRight={step === total - 1 ? 'leaf-outline' : 'arrow-forward'}
          onPress={() => {
            tap('select');
            if (step === total - 1) {
              void Analytics.track('grounding_completed', { durationMs: Date.now() - startedAt.current });
              router.back();
            } else {
              setStep(step + 1);
            }
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  numberRing: {
    width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', borderWidth: 3,
  },
});

