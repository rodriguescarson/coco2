import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../lib/theme';

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  contentInset?: number;
};

export function Screen({ children, scroll = false, edges = ['top', 'bottom'], style, contentStyle, contentInset = 16 }: Props) {
  const { colors } = useTheme();
  const Body = scroll ? ScrollView : View;
  const bodyProps = scroll
    ? {
        contentContainerStyle: [{ padding: contentInset, paddingBottom: 80 }, contentStyle],
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
      }
    : { style: [{ flex: 1, padding: contentInset }, contentStyle] };

  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.bg }, style]}>
      {/* @ts-ignore -- Body discriminates props above */}
      <Body {...bodyProps}>{children}</Body>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
