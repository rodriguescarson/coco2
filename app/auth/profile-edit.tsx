import { useEffect, useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../components/ui/Text';
import { Card } from '../../components/ui/Card';
import { Pill } from '../../components/ui/Pill';
import { Button } from '../../components/ui/Button';
import { useTheme, spacing, radius } from '../../lib/theme';
import { Storage, ContactProfile } from '../../lib/storage';
import { DataWrite } from '../../lib/data-write';
import { tap } from '../../lib/haptics';
import { useScreenTracking, Analytics } from '../../lib/analytics';

const genders = ['Woman', 'Man', 'Non-binary', 'Genderfluid', 'Prefer not to say', 'Self-describe'];
const ageRanges = ['Under 18', '18–24', '25–34', '35–44', '45–54', '55–64', '65+'];

export default function ProfileEdit() {
  useScreenTracking('auth/profile-edit');
  const { colors } = useTheme();
  const [c, setContact] = useState<ContactProfile>({});
  const [name, setName] = useState('');
  const [selfGender, setSelfGender] = useState('');

  useEffect(() => {
    Storage.getContact().then(setContact);
    Storage.getUser().then((u) => setName(u.name ?? ''));
  }, []);

  function update<K extends keyof ContactProfile>(k: K, v: ContactProfile[K]) {
    setContact((s) => ({ ...s, [k]: v }));
  }

  async function save() {
    const merged: ContactProfile = { ...c };
    if (c.gender === 'Self-describe' && selfGender.trim()) merged.gender = selfGender.trim();
    await DataWrite.setContact(merged);
    await DataWrite.setUser({ ...(await Storage.getUser()), name: name.trim() || undefined });
    void Analytics.track('profile_updated', {
      hasEmail: !!merged.email,
      hasPhone: !!merged.phone,
      hasGender: !!merged.gender,
      hasAge: !!merged.ageRange,
      hasCountry: !!merged.country,
      researchConsent: !!merged.consentResearch,
    });
    tap('success');
    router.back();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Cancel" hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <Text variant="bodyMedium">Your details</Text>
        <Pressable onPress={save} hitSlop={12}>
          <Text variant="bodyMedium" style={{ color: colors.primary, fontWeight: '700' }}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Text variant="display">A bit about you.</Text>
        <Text variant="caption" tone="dim" style={{ marginTop: 4 }}>
          All optional. Helps Coco personalize gently. Stored under your account.
        </Text>

        <Section title="Name">
          <Field
            value={name}
            onChange={setName}
            placeholder="What should Coco call you?"
            colors={colors}
            keyboardType="default"
            label="Name"
          />
        </Section>

        <Section title="Email">
          <Field
            value={c.email ?? ''}
            onChange={(v) => update('email', v)}
            placeholder="you@example.com"
            colors={colors}
            keyboardType="email-address"
            label="Email"
          />
        </Section>

        <Section title="Phone">
          <Field
            value={c.phone ?? ''}
            onChange={(v) => update('phone', v)}
            placeholder="+1 555 123 4567"
            colors={colors}
            keyboardType="phone-pad"
            label="Phone"
          />
        </Section>

        <Section title="Gender">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {genders.map((g) => (
              <Pill key={g} label={g} selected={c.gender === g} onPress={() => update('gender', g)} />
            ))}
          </View>
          {c.gender === 'Self-describe' ? (
            <Field
              value={selfGender}
              onChange={setSelfGender}
              placeholder="In your own words"
              colors={colors}
              keyboardType="default"
              label="Self-describe gender"
              style={{ marginTop: spacing.sm }}
            />
          ) : null}
        </Section>

        <Section title="Age range">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {ageRanges.map((a) => (
              <Pill key={a} label={a} selected={c.ageRange === a} onPress={() => update('ageRange', a)} />
            ))}
          </View>
        </Section>

        <Section title="Country">
          <Field
            value={c.country ?? ''}
            onChange={(v) => update('country', v)}
            placeholder="So we can show local hotlines"
            colors={colors}
            keyboardType="default"
            label="Country"
          />
        </Section>

        <Card style={{ marginTop: spacing.xl }} tone="muted">
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: spacing.md }}>
              <Text variant="bodyMedium">Help research</Text>
              <Text variant="caption" tone="dim">Allow anonymized, aggregated insights to improve Coco. Never sold or shared with advertisers.</Text>
            </View>
            <Switch
              value={!!c.consentResearch}
              onValueChange={(v) => update('consentResearch', v)}
              trackColor={{ true: colors.primary, false: colors.border }}
              thumbColor="#fff"
            />
          </View>
        </Card>

        <Button label="Save" icon="checkmark" fullWidth size="lg" style={{ marginTop: spacing.xl }} onPress={save} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: spacing.xl }}>
      <Text variant="micro" tone="dim" style={{ marginBottom: spacing.sm, textTransform: 'uppercase' }}>{title}</Text>
      {children}
    </View>
  );
}

function Field({ value, onChange, placeholder, colors, keyboardType, label, style }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof useTheme>['colors'];
  keyboardType: 'default' | 'email-address' | 'phone-pad';
  label: string;
  style?: object;
}) {
  return (
    <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.lg, padding: 14, borderWidth: StyleSheet.hairlineWidth }, style]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={{ color: colors.text, fontSize: 16 }}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
});
