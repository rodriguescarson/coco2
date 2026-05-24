import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
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
import { useScreenTracking, Analytics } from '../../lib/analytics';
import { KeyboardAwareScrollView as ScrollView } from 'react-native-keyboard-controller';

export default function SignIn() {
  useScreenTracking('auth/sign-in');
  const { colors } = useTheme();
  const { user, available } = useAuth();
  const google = useGoogleSignIn();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ provider: string; identity: string } | null>(null);

  // Auto-close after a successful sign-in so the user lands back on Profile
  // and sees the synced banner. Gives a beat to read the confirmation.
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => {
      router.back();
    }, 1600);
    return () => clearTimeout(t);
  }, [success]);

  async function doEmail() {
    if (!email.trim() || password.length < 6) {
      setError('Email + a password of 6+ characters.');
      return;
    }
    setBusy('email');
    setError(null);
    try {
      await upgradeWithEmailPassword(email.trim(), password);
      void Analytics.track('auth_success', { provider: 'email' });
      tap('success');
      setSuccess({ provider: 'email', identity: email.trim() });
    } catch (e) {
      void Analytics.track('auth_failed', { provider: 'email', reason: (e as Error).message.slice(0, 80) });
      setError(friendlyAuthError((e as Error).message));
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
    if (r.ok) {
      void Analytics.track('auth_success', { provider: 'google' });
      tap('success');
      setSuccess({ provider: 'google', identity: 'Google account' });
    } else {
      void Analytics.track('auth_failed', { provider: 'google', reason: r.reason.slice(0, 80) });
      setError(r.reason);
      tap('warn');
    }
  }

  async function doApple() {
    setBusy('apple');
    setError(null);
    const r = await signInWithApple();
    setBusy(null);
    if (r.ok) {
      void Analytics.track('auth_success', { provider: 'apple' });
      tap('success');
      setSuccess({ provider: 'apple', identity: 'Apple ID' });
    } else {
      void Analytics.track('auth_failed', { provider: 'apple', reason: r.reason.slice(0, 80) });
      setError(r.reason);
      tap('warn');
    }
  }

  // Render a clear success state inside the modal so the user sees their
  // sign-in landed before the modal auto-closes.
  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
        <View style={styles.header}>
          <View style={{ width: 28 }} />
          <Text variant="bodyMedium">Sync your Coco</Text>
          <Pressable onPress={() => router.back()} accessibilityLabel="Done" hitSlop={12}>
            <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '700' }}>Done</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
          <View style={[styles.successCircle, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
            <Ionicons name="cloud-done" size={64} color={colors.primary} />
          </View>
          <Text variant="display" align="center" style={{ marginTop: spacing.xl }}>You're synced.</Text>
          <Text variant="body" tone="dim" align="center" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
            Signed in as <Text variant="bodyMedium" tone="primary">{success.identity}</Text>. Your moods, journals, check-ins and chat history will follow you across devices.
          </Text>
          <Card tone="primary" style={{ marginTop: spacing.xl, alignSelf: 'stretch' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
              <Text variant="caption" tone="primary" style={{ flex: 1 }}>
                Pulling existing data from the cloud, pushing local writes that haven't synced yet…
              </Text>
            </View>
          </Card>
          <Button label="Done" icon="arrow-forward" fullWidth size="lg" style={{ marginTop: spacing.xl }} onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
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

// Translate Firebase error codes / messages into plain language.
function friendlyAuthError(raw: string): string {
  if (/email-already-in-use/i.test(raw)) {
    return 'That email is already in use. Tap "Have an account? Sign in" to log in instead.';
  }
  if (/wrong-password|invalid-credential/i.test(raw)) {
    return "Email or password didn't match. Try again, or tap 'New here? Create an account'.";
  }
  if (/user-not-found/i.test(raw)) {
    return "No account with that email. Tap 'New here? Create an account' to make one.";
  }
  if (/weak-password/i.test(raw)) {
    return 'Password needs to be at least 6 characters.';
  }
  if (/network-request-failed/i.test(raw)) {
    return 'Network hiccup — check your connection and try again.';
  }
  if (/too-many-requests/i.test(raw)) {
    return 'Too many attempts. Take a breath and try again in a minute.';
  }
  return raw;
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
  successCircle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
});
