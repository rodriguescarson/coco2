import { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Text } from '../../components/ui/Text';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useTheme, spacing, radius } from '../../lib/theme';
import { useAuth, useGoogleSignIn, signInWithApple, upgradeWithEmailPassword } from '../../lib/auth';
import { tap } from '../../lib/haptics';

export default function SignIn() {
  const { colors } = useTheme();
  const { user, available } = useAuth();
  const google = useGoogleSignIn();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function notify(msg: string) {
    if (Platform.OS === 'web') window.alert(msg);
    else Alert.alert('Coco', msg);
  }

  async function doEmail() {
    if (!email.trim() || password.length < 6) {
      setError('Email + a password of 6+ characters.');
      return;
    }
    setBusy('email');
    setError(null);
    try {
      await upgradeWithEmailPassword(email.trim(), password);
      tap('success');
      router.back();
    } catch (e) {
      setError((e as Error).message);
      tap('warn');
    } finally {
      setBusy(null);
    }
  }

  async function doGoogle() {
    setBusy('google');
    setError(null);
    const r = await google.start();
    setBusy(null);
    if (r.ok) { tap('success'); router.back(); }
    else { setError(r.reason); tap('warn'); }
  }

  async function doApple() {
    setBusy('apple');
    setError(null);
    const r = await signInWithApple();
    setBusy(null);
    if (r.ok) { tap('success'); router.back(); }
    else { setError(r.reason); tap('warn'); }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Sync your Coco</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Text variant="display">Sign in to sync.</Text>
        <Text variant="body" tone="dim" style={{ marginTop: 6 }}>
          Optional. Your moods, journals and check-ins follow you across devices and stay encrypted in transit.
        </Text>

        {!available ? (
          <Card tone="muted" style={{ marginTop: spacing.lg }}>
            <Text variant="bodyMedium">Sync not configured</Text>
            <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
              Add the Firebase web app id in app.json (`extra.firebase.appId`) to enable sign-in. Until then, everything still works locally.
            </Text>
          </Card>
        ) : (
          <>
            {user && !user.isAnonymous ? (
              <Card tone="primary" style={{ marginTop: spacing.lg }}>
                <Text variant="bodyMedium" tone="primary">You're signed in</Text>
                <Text variant="caption" tone="primary" style={{ marginTop: 4, opacity: 0.85 }}>
                  {user.email ?? user.uid.slice(0, 8)}
                </Text>
              </Card>
            ) : null}

            <View style={{ gap: spacing.md, marginTop: spacing.xl }}>
              <Button
                label="Continue with Google"
                icon="logo-google"
                variant="secondary"
                size="lg"
                fullWidth
                loading={busy === 'google'}
                onPress={doGoogle}
              />
              {Platform.OS === 'ios' ? (
                <AppleSignInButton onPress={doApple} loading={busy === 'apple'} />
              ) : null}
            </View>

            <View style={[styles.divider, { borderColor: colors.border }]}>
              <Text variant="micro" tone="dim" style={{ paddingHorizontal: 12, backgroundColor: colors.bg }}>
                OR EMAIL
              </Text>
            </View>

            <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.md }]}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textFaint}
                style={{ color: colors.text, fontSize: 16 }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessibilityLabel="Email"
              />
            </View>
            <View style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: spacing.sm }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password (6+ chars)"
                placeholderTextColor={colors.textFaint}
                style={{ color: colors.text, fontSize: 16 }}
                secureTextEntry
                autoComplete="password"
                accessibilityLabel="Password"
              />
            </View>

            {error ? <Text variant="caption" tone="danger" style={{ marginTop: spacing.sm }}>{error}</Text> : null}

            <Button
              label={mode === 'signin' ? 'Sign in' : 'Create account'}
              icon="checkmark"
              fullWidth
              size="lg"
              style={{ marginTop: spacing.md }}
              loading={busy === 'email'}
              onPress={doEmail}
            />
            <Pressable onPress={() => setMode((m) => (m === 'signin' ? 'signup' : 'signin'))} hitSlop={8} style={{ alignSelf: 'center', marginTop: spacing.md }}>
              <Text variant="caption" tone="primary">
                {mode === 'signin' ? 'New here? Create an account' : 'Have an account? Sign in'}
              </Text>
            </Pressable>
          </>
        )}

        <Card tone="muted" style={{ marginTop: spacing.xl }}>
          <Text variant="caption" tone="dim">
            We never sell your data. Your moods and journals are stored under your account in Firestore. You can erase everything from Profile → Erase all my data.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function AppleSignInButton({ onPress, loading }: { onPress: () => void; loading: boolean }) {
  const { scheme } = useTheme();
  if (loading) {
    return <Button label="Signing in with Apple…" variant="secondary" size="lg" fullWidth loading />;
  }
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={
        scheme === 'dark'
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={28}
      style={{ width: '100%', height: 56 }}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  input: { borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 0,
    height: 0,
  },
});
