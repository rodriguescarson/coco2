import { ReactNode } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { useTheme, spacing } from '../../lib/theme';

type Props = {
  title?: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
};

export function Header({ title, subtitle, back, right }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { marginBottom: spacing.lg }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={12}
            style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {subtitle ? <Text variant="micro" tone="dim" style={{ textTransform: 'uppercase' }}>{subtitle}</Text> : null}
          {title ? <Text variant="title">{title}</Text> : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
});
