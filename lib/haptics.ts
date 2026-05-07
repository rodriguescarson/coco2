import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'tap' | 'select' | 'success' | 'warn' | 'error';

export function tap(kind: HapticKind = 'tap') {
  if (Platform.OS === 'web') return;
  switch (kind) {
    case 'select':
      Haptics.selectionAsync().catch(() => {});
      return;
    case 'success':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return;
    case 'warn':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      return;
    case 'error':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    default:
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  }
}
