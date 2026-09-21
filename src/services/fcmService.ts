import { getFCMToken } from "../firebase";
import { api } from "./apiClient";

export { getFCMToken };

/**
 * Save FCM token to backend API using existing API client:
 * PATCH /api/v1/users/{userId}/fcm-token
 */
export async function saveFCMToken(
  userId: string | number,
  fcmToken: string
): Promise<boolean> {
  try {
    if (!userId || !fcmToken) {
      return false;
    }

    await api.updateFcmToken(userId, fcmToken);
    console.log("[FCM] Token saved successfully");
    return true;
  } catch (error) {
    console.error("[FCM] Backend registration failed", error);
    return false;
  }
}

/**
 * Register FCM token for the given authenticated user ID.
 * Flow:
 * registerFCMToken(userId)
 *         ↓
 *   getFCMToken()
 *         ↓
 *  token available?
 *    ┌────┴────┐
 *    NO       YES
 *    ↓         ↓
 *  return    PATCH backend
 */
export async function registerFCMToken(
  userId: string | number
): Promise<boolean> {
  try {
    if (!userId) {
      return false;
    }

    console.log(`[FCM] Registering token for user: ${userId}`);

    // 1. Get token from Firebase (handles permission and support checks)
    const token = await getFCMToken();

    if (!token) {
      return false;
    }

    // 2. Save token to backend
    return await saveFCMToken(userId, token);
  } catch (error) {
    console.error("[FCM] Backend registration failed", error);
    return false;
  }
}