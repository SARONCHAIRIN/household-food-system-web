export { app, getFCMToken, listenForForegroundMessages } from '../firebase';
import { getFCMToken } from '../firebase';

/**
 * Backward compatibility helper for components requesting notification permission
 */
export async function requestNotificationPermission(): Promise<string> {
  const token = await getFCMToken();
  if (!token) {
    throw new Error('Notification permission was not granted or FCM token generation failed.');
  }
  return token;
}