import { ActivityIndicator, Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme, radius, spacing } from '../../lib/theme';
import { Text } from './Text';
import { tap } from '../../lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { ComponentProps } from 'react';

type IconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  accessibilityHint,
}: Props) {
  const { colors } = useTheme();
  const heights = { sm: 38, md: 48, lg: 56 } as const;
  const height = heights[size];

  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.surface
    : variant === 'danger' ? colors.danger
    : 'transparent';
  const fg =
    variant === 'primary' ? colors.primaryFg
    : variant === 'danger' ? '#fff'
    : variant === 'secondary' ? colors.text
    : colors.primary;
  const borderColor =
    variant === 'secondary' ? colors.border
    : variant === 'ghost' ? 'transparent'
    : 'transparent';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      disabled={disabled || loading}
      onPress={() => {
        if (disabled || loading) return;
        tap(variant === 'danger' ? 'warn' : 'tap');
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height,
          backgroundColor: bg,
          borderColor,
          borderWidth: variant === 'secondary' ? StyleSheet.hairlineWidth : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          paddingHorizontal: size === 'sm' ? spacing.md : spacing.xl,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        {loading ? (
          <ActivityIndicator color={fg} size="small" />
        ) : (
          <>
            {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={fg} style={{ marginRight: 8 }} /> : null}
            <Text variant={size === 'sm' ? 'caption' : 'bodyMedium'} style={{ color: fg, fontWeight: '600' }}>
              {label}
            </Text>
            {iconRight ? <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={fg} style={{ marginLeft: 8 }} /> : null}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center' },
});
