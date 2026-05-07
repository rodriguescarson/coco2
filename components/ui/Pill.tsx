import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { useTheme, radius } from '../../lib/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'primary' | 'danger' | 'accent';
  style?: ViewStyle;
};

export function Pill({ label, selected, onPress, tone = 'default', style }: Props) {
  const { colors } = useTheme();
  const bg = selected
    ? tone === 'danger' ? colors.danger
    : tone === 'accent' ? colors.accent
    : colors.primary
    : colors.surface;
  const border = selected ? bg : colors.border;
  const fg = selected ? '#fff' : colors.text;
  const Tag = onPress ? Pressable : View;
  return (
    <Tag
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: border, borderWidth: StyleSheet.hairlineWidth },
        style,
      ]}
    >
      <Text variant="caption" style={{ color: fg, fontWeight: '600' }}>{label}</Text>
    </Tag>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
});
