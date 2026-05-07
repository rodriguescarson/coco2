import { useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '../components/ui/Screen';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { Pill } from '../components/ui/Pill';
import { Card } from '../components/ui/Card';
import { useTheme, spacing, radius } from '../lib/theme';
import { Storage } from '../lib/storage';
import { DataWrite } from '../lib/data-write';
import { useScreenTracking, Analytics } from '../lib/analytics';

const goals = ['Reduce anxiety', 'Sleep better', 'Track my mood', 'Build habits', 'Process feelings', 'Find a therapist'];

export default function Onboarding() {
  useScreenTracking('onboarding');
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [chosen, setChosen] = useState<string[]>([]);

  function toggle(g: string) {
    setChosen((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]));
  }

  async function finish() {
    await DataWrite.setUser({ name: name.trim() || undefined, goals: chosen });
    await Storage.setOnboarded(true);
    void Analytics.track('onboarding_completed', { hasName: !!name.trim(), goalsCount: chosen.length });
    router.replace('/(tabs)');
  }

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        {step === 0 && (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ marginTop: spacing.xxxl }}>
              <View style={[styles.logoCircle, { backgroundColor: colors.primarySoft }]}>
                <Text variant="display" tone="primary">co</Text>
              </View>
              <Text variant="display" style={{ marginTop: spacing.xl }}>Welcome to Coco.</Text>
              <Text variant="body" tone="dim" style={{ marginTop: spacing.sm }}>
                A quiet companion for your mind. Track how you feel, breathe through the hard parts, and talk to Coco when you need someone to listen.
              </Text>
            </View>
            <View style={{ gap: spacing.md }}>
              <Card tone="muted" pad="md">
                <Text variant="caption" tone="dim">
                  Coco is not a substitute for emergency care. If you are in crisis, tap SOS at any time for a hotline.
                </Text>
              </Card>
              <Button label="Get started" iconRight="arrow-forward" fullWidth size="lg" onPress={() => setStep(1)} />
            </View>
          </View>
        )}

        {step === 1 && (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ marginTop: spacing.xxl }}>
              <Text variant="micro" tone="dim">STEP 1 OF 2</Text>
              <Text variant="title" style={{ marginTop: spacing.xs }}>What can I call you?</Text>
              <Text variant="body" tone="dim" style={{ marginTop: spacing.sm }}>
                Optional. Stays on your device.
              </Text>
              <View style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface, marginTop: spacing.xl }]}>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name or a nickname"
                  placeholderTextColor={colors.textFaint}
                  style={{ color: colors.text, fontSize: 18 }}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => setStep(2)}
                  accessibilityLabel="Your name"
                />
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Skip" variant="ghost" onPress={() => setStep(2)} />
              <View style={{ flex: 1 }} />
              <Button label="Next" iconRight="arrow-forward" onPress={() => setStep(2)} />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <View style={{ marginTop: spacing.xxl }}>
              <Text variant="micro" tone="dim">STEP 2 OF 2</Text>
              <Text variant="title" style={{ marginTop: spacing.xs }}>What brings you here?</Text>
              <Text variant="body" tone="dim" style={{ marginTop: spacing.sm }}>
                Pick any that fit. We will personalize Coco around them.
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xl }}>
                {goals.map((g) => (
                  <Pill key={g} label={g} selected={chosen.includes(g)} onPress={() => toggle(g)} />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Button label="Back" variant="ghost" onPress={() => setStep(1)} />
              <View style={{ flex: 1 }} />
              <Button label="Begin" iconRight="leaf" onPress={finish} />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: 16 },
});

