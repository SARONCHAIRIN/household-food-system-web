import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
} from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export async function requestNotificationPermission(): Promise<string> {
  // Check browser support
  if (typeof window === 'undefined') {
    throw new Error('This is not running in a browser.');
  }

  if (!('Notification' in window)) {
    throw new Error('This browser does not support notifications.');
  }

  if (!('serviceWorker' in navigator)) {
    throw new Error('This browser does not support Service Workers.');
  }

  // Request notification permission
  const permission = await Notification.requestPermission();

  console.log('Notification permission:', permission);

  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  // Register Firebase Messaging Service Worker
  const registration = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  );

  console.log(
    'Firebase Messaging Service Worker registered:',
    registration
  );

  // Get Firebase Messaging instance
  const messaging = getMessaging(app);

  // Get FCM token
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error('FCM token was not generated.');
  }

  console.log('FCM Web Token:', token);

  return token;
}

export function listenForForegroundMessages() {
  if (typeof window === 'undefined') {
    return;
  }

  if (!('Notification' in window)) {
    return;
  }

  const messaging = getMessaging(app);

  onMessage(messaging, (payload) => {
    console.log('Foreground notification:', payload);

    const title =
      payload.notification?.title ?? 'Household Food';

    const body =
      payload.notification?.body ?? '';

    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
      });
    }
  });
}