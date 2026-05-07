import { ReactNode } from 'react';
import { Pressable, View, ViewStyle, StyleSheet, AccessibilityRole } from 'react-native';
import { useTheme, radius, spacing } from '../../lib/theme';
import { tap } from '../../lib/haptics';

type Props = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  tone?: 'surface' | 'muted' | 'primary' | 'accent' | 'danger';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: AccessibilityRole;
  pad?: keyof typeof spacing;
};

export function Card({
  children,
  onPress,
  style,
  tone = 'surface',
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  pad = 'lg',
}: Props) {
  const { colors } = useTheme();
  const bg =
    tone === 'muted' ? colors.surfaceMuted
    : tone === 'primary' ? colors.primarySoft
    : tone === 'accent' ? colors.accentSoft
    : tone === 'danger' ? colors.dangerSoft
    : colors.surface;

  const inner = (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.lg,
          padding: spacing[pad],
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (!onPress) return inner;

  return (
    <Pressable
      onPress={() => {
        tap('select');
        onPress();
      }}
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {inner}
    </Pressable>
  );
}
