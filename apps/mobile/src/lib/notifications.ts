import { router } from 'expo-router';

type NotificationData = {
  type?: 'new_task' | 'sla_warning' | 'negative_feedback' | string;
  taskId?: string;
  guestId?: string;
};

interface NotificationResponse {
  notification: { request: { content: { data?: Record<string, unknown> } } };
}

interface NotificationsApi {
  setNotificationHandler: (handler: { handleNotification: () => Promise<unknown> }) => void;
  addNotificationResponseReceivedListener: (
    cb: (response: NotificationResponse) => void,
  ) => { remove: () => void };
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  getDevicePushTokenAsync: () => Promise<{ data: string }>;
}

function loadNotifications(): NotificationsApi | null {
  try {
    // Conditional require — `expo-notifications` is optional and may not be
    // installed in dev builds. When absent we degrade to a no-op.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('expo-notifications') as NotificationsApi;
  } catch {
    return null;
  }
}

/**
 * Wires up FCM / Expo push notification handlers for the staff app.
 * Degrades gracefully when `expo-notifications` is not installed.
 */
export function registerStaffNotifications(): () => void {
  const Notifications = loadNotifications();
  if (!Notifications) return () => {};

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = (response.notification.request.content.data ?? {}) as NotificationData;
    routeFromNotification(data);
  });

  return () => sub.remove();
}

export function routeFromNotification(data: NotificationData): void {
  if (data.type === 'new_task' && data.taskId) {
    router.push({ pathname: '/(staff)/task', params: { id: data.taskId } });
  } else if (data.type === 'sla_warning' && data.taskId) {
    router.push({ pathname: '/(staff)/task', params: { id: data.taskId } });
  } else if (data.type === 'negative_feedback' && data.guestId) {
    router.push({ pathname: '/(staff)/guest', params: { id: data.guestId } });
  } else if (data.taskId) {
    router.push({ pathname: '/(staff)/task', params: { id: data.taskId } });
  } else if (data.guestId) {
    router.push({ pathname: '/(staff)/guest', params: { id: data.guestId } });
  }
}

export async function registerPushToken(staffUserId: string): Promise<string | null> {
  const Notifications = loadNotifications();
  if (!Notifications) return null;
  try {
    const granted = await Notifications.requestPermissionsAsync();
    if (!granted.granted) return null;
    const token = await Notifications.getDevicePushTokenAsync();
    void staffUserId;
    return token?.data ?? null;
  } catch {
    return null;
  }
}
