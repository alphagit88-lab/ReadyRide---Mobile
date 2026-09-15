import {Platform, PermissionsAndroid} from 'react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  requestPermission,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';

export async function requestUserPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied');
        return false;
      }
    }

    const messaging = getMessaging();
    const authStatus = await requestPermission(messaging);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    return enabled;
  } catch (e) {
    console.warn('FCM permission request failed:', e);
    return false;
  }
}

export async function getFcmToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'ios') {
      await registerDeviceForRemoteMessages(getMessaging());
    }
    const token = await getToken(getMessaging());
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Register FCM token with the backend.
 */
export async function registerFcmToken(
  apiUrl: string,
  authToken: string,
): Promise<void> {
  try {
    const permitted = await requestUserPermission();
    if (!permitted) {
      return;
    }

    const fcmToken = await getFcmToken();
    if (!fcmToken) {
      return;
    }

    await fetch(`${apiUrl}/user/fcm-token`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
        Accept: 'application/json',
      },
      body: JSON.stringify({fcm_token: fcmToken}),
    });

    console.log('FCM token registered with backend');
  } catch (err) {
    console.error('Failed to register FCM token:', err);
  }
}

/**
 * Subscribe to foreground messages. Returns the unsubscribe function.
 */
export function subscribeToForegroundNotifications(
  onNotification: (
    title: string,
    body: string,
    data: Record<string, string>,
  ) => void,
): () => void {
  try {
    const unsubscribe = onMessage(getMessaging(), async remoteMessage => {
      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';
      const data = (remoteMessage.data as Record<string, string>) || {};
      console.log('FCM foreground message:', title, body);
      onNotification(title, body, data);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('subscribeToForegroundNotifications failed:', e);
    return () => {};
  }
}
