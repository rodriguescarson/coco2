import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme, typography } from '../../lib/theme';

type Variant = keyof typeof typography;

type Props = TextProps & {
  variant?: Variant;
  tone?: 'default' | 'dim' | 'faint' | 'primary' | 'accent' | 'danger' | 'onPrimary';
  align?: 'left' | 'center' | 'right';
};

export function Text({ variant = 'body', tone = 'default', align, style, ...rest }: Props) {
  const { colors } = useTheme();
  const color =
    tone === 'dim' ? colors.textDim
    : tone === 'faint' ? colors.textFaint
    : tone === 'primary' ? colors.primary
    : tone === 'accent' ? colors.accent
    : tone === 'danger' ? colors.danger
    : tone === 'onPrimary' ? colors.primaryFg
    : colors.text;
  return (
    <RNText
      {...rest}
      style={[typography[variant], { color }, align ? { textAlign: align } : null, style]}
      maxFontSizeMultiplier={1.6}
    />
  );
}
