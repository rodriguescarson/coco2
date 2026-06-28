// App-boot wiring for notifications. Mount once near the root (in
// AuthBootstrap). It:
//   - installs the (calm) notification handler,
//   - and, ONLY if the user has already opted in AND granted OS permission,
//     re-registers the push token and reconciles the daily reminder.
//
// It never asks for permission and never schedules anything on its own — those
// only happen from the explicit toggle on the settings screen. So a user who
// hasn't opted in is never touched.

import { useEffect } from 'react';
import {
  configureNotificationHandler,
  getNotificationSettings,
  hasNotificationPermission,
  registerPushToken,
  syncDailyReminder,
} from './notifications';

export function useNotificationBootstrap(uid: string | undefined): void {
  // Configure the handler synchronously on first render so a tapped
  // notification is presented consistently.
  useEffect(() => {
    configureNotificationHandler();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const settings = await getNotificationSettings();
        if (!settings.enabled) return; // opt-in: do nothing until turned on
        if (!(await hasNotificationPermission())) return;
        if (cancelled) return;
        // Token registration needs a signed-in uid to land in Firestore, but
        // local reminders work regardless.
        if (uid) void registerPushToken();
        await syncDailyReminder();
      } catch {
        // best-effort — never block app boot
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);
}
