import PushNotification, { Importance } from 'react-native-push-notification';
import { Platform } from 'react-native';

export type NotificationPayload = {
  title: string;
  message: string;
  data?: Record<string, unknown>;
  channelId?: string;
};

class NotificationService {
  private isConfigured = false;
  private onNotificationCallback?: (data: Record<string, unknown>) => void;

  configure(onNotification?: (data: Record<string, unknown>) => void): void {
    if (this.isConfigured) return;
    this.onNotificationCallback = onNotification;

    PushNotification.configure({
      onRegister: (token) => {
        console.log('Push token:', token);
        // Send token to backend for server-side push
        this.registerTokenWithBackend(token.token);
      },

      onNotification: (notification) => {
        if (this.onNotificationCallback && notification.data) {
          this.onNotificationCallback(notification.data as Record<string, unknown>);
        }
        notification.finish?.('backgroundFetchResultNewData');
      },

      onAction: (notification) => {
        console.log('Notification action:', notification.action);
      },

      onRegistrationError: (err) => {
        console.error('Push registration error:', err.message, err);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: Platform.OS === 'ios',
    });

    this.createDefaultChannels();
    this.isConfigured = true;
  }

  private createDefaultChannels(): void {
    PushNotification.createChannel(
      {
        channelId: 'queue-updates',
        channelName: 'Queue Updates',
        channelDescription: 'Notifications for queue position changes',
        importance: Importance.HIGH,
        vibrate: true,
        soundName: 'default',
      },
      (created) => console.log(`Queue channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'venue-alerts',
        channelName: 'Venue Alerts',
        channelDescription: 'Important alerts from the venue',
        importance: Importance.HIGH,
        vibrate: true,
        soundName: 'default',
      },
      (created) => console.log(`Venue alerts channel created: ${created}`)
    );

    PushNotification.createChannel(
      {
        channelId: 'navigation',
        channelName: 'Navigation',
        channelDescription: 'Turn-by-turn navigation guidance',
        importance: Importance.DEFAULT,
        vibrate: false,
        soundName: 'default',
      },
      (created) => console.log(`Navigation channel created: ${created}`)
    );
  }

  sendLocalNotification(payload: NotificationPayload): void {
    PushNotification.localNotification({
      channelId: payload.channelId ?? 'venue-alerts',
      title: payload.title,
      message: payload.message,
      userInfo: payload.data,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      priority: 'high',
    });
  }

  scheduleNotification(payload: NotificationPayload & { date: Date }): void {
    PushNotification.localNotificationSchedule({
      channelId: payload.channelId ?? 'queue-updates',
      title: payload.title,
      message: payload.message,
      date: payload.date,
      userInfo: payload.data,
      allowWhileIdle: true,
    });
  }

  cancelAll(): void {
    PushNotification.cancelAllLocalNotifications();
  }

  setBadgeCount(count: number): void {
    PushNotification.setApplicationIconBadgeNumber(count);
  }

  private async registerTokenWithBackend(token: string): Promise<void> {
    try {
      const { default: api } = await import('./api');
      await api.post('/users/push-token', { token, platform: Platform.OS });
    } catch (error) {
      console.warn('Failed to register push token with backend:', error);
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
