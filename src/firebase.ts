import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  isSupported,
  onMessage,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Get Firebase Cloud Messaging token safely.
 * Returns the token string on success, or null if unsupported, denied, or failed.
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    console.log("[FCM] Checking notification support");

    if (typeof window === "undefined") {
      console.warn("[FCM] Firebase messaging unsupported");
      return null;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      console.warn("[FCM] Firebase messaging unsupported");
      return null;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn("[FCM] Firebase messaging unsupported");
      return null;
    }

    // Handle existing permission states
    let permission: NotificationPermission = Notification.permission;
    if (permission === "denied") {
      console.warn("[FCM] Notification permission denied");
      return null;
    }

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      console.warn("[FCM] Notification permission denied");
      return null;
    }

    console.log("[FCM] Notification permission: granted");

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );
    await navigator.serviceWorker.ready;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      console.error("[FCM] Token generation failed");
      return null;
    }

    console.log("[FCM] Token generated");
    return token;
  } catch (error) {
    console.error("[FCM] Token generation failed", error);
    return null;
  }
}

export function listenForForegroundMessages() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  const messaging = getMessaging(app);

  return onMessage(messaging, (payload) => {
    console.log("🔔 FCM foreground message:", payload);

    if (Notification.permission === "granted") {
      new Notification(
        payload.notification?.title || "Household Food",
        {
          body: payload.notification?.body || "",
          icon: "/favicon.ico",
        }
      );
    }
  });
}