import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getColors } from '../lib/theme';

export default function RootLayout() {
  const scheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const colors = getColors(scheme);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});
  }, [colors.bg]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          <Stack.Screen name="chat" options={{ presentation: 'modal' }} />
          <Stack.Screen name="sos" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="breathe" />
          <Stack.Screen name="checkin" options={{ presentation: 'modal' }} />
          <Stack.Screen name="mood" options={{ presentation: 'modal' }} />
          <Stack.Screen name="journal/[id]" />
          <Stack.Screen name="journal/new" options={{ presentation: 'modal' }} />
          <Stack.Screen name="meditate" />
          <Stack.Screen name="sleep" />
          <Stack.Screen name="places" />
          <Stack.Screen name="therapists" />
          <Stack.Screen name="voice-therapy" />
          <Stack.Screen name="grounding" options={{ presentation: 'modal' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
