import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from './Text';
import { useTheme } from '../../lib/theme';
import { tap } from '../../lib/haptics';

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'leaf-outline',
  tools: 'sparkles-outline',
  connect: 'people-outline',
  profile: 'person-outline',
};

const ACTIVE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: 'leaf',
  tools: 'sparkles',
  connect: 'people',
  profile: 'person',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  tools: 'Tools',
  connect: 'Connect',
  profile: 'You',
};

const ORDER = ['index', 'tools', '__chat__', 'connect', 'profile'];

export function CocoTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  const routesByName = Object.fromEntries(state.routes.map((r) => [r.name, r]));
  const activeName = state.routes[state.index]?.name;

  return (
    <View style={[styles.wrap, { backgroundColor: colors.bgElevated, borderTopColor: colors.border, paddingBottom: bottomPad }]}>
      {ORDER.map((name) => {
        if (name === '__chat__') {
          return <CenterChatButton key="chat" colors={colors} />;
        }
        const route = routesByName[name];
        if (!route) return null;
        const focused = activeName === name;
        const icon = focused ? ACTIVE_ICONS[name] : ICONS[name];
        const color = focused ? colors.primary : colors.textFaint;

        return (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={LABELS[name]}
            onPress={() => {
              tap('select');
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [styles.slot, { opacity: pressed ? 0.65 : 1 }]}
          >
            <Ionicons name={icon} size={focused ? 24 : 22} color={color} />
            <Text variant="micro" style={{ color, marginTop: 4 }}>{LABELS[name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function CenterChatButton({ colors }: { colors: ReturnType<typeof useTheme>['colors'] }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.centerSlot} pointerEvents="box-none">
      <Animated.View style={[animStyle, styles.fabWrap]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Talk to Coco"
          accessibilityHint="Opens the AI companion chat"
          onPressIn={() => { scale.value = withSpring(0.92, { damping: 18, stiffness: 240 }); }}
          onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 200 }); }}
          onPress={() => { tap('tap'); router.push('/chat'); }}
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
              opacity: pressed ? 0.95 : 1,
            },
          ]}
        >
          <View style={[styles.fabRing, { borderColor: colors.bgElevated }]} />
          <Ionicons name="chatbubble-ellipses" size={26} color={colors.primaryFg} />
        </Pressable>
      </Animated.View>
      <Text variant="micro" style={{ color: colors.primary, marginTop: 4 }}>Coco</Text>
    </View>
  );
}

const FAB_SIZE = 60;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {},
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    minHeight: 56,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fabWrap: {
    marginTop: -22,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 10,
  },
  fabRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 4,
  },
});

