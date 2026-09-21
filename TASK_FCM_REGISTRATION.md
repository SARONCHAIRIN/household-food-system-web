# Task: Implement Firebase FCM Token Registration After Successful Login

## Objective
Implement Firebase Cloud Messaging (FCM) token registration into the **existing** authentication flow of the Household Food System web application.

---

## Architectural Flow

```text
User submits login credentials
              │
              ▼
   Existing Login API (/auth/login)
              │
              ▼
       Login successful
              │
              ▼
   JWT & Auth State saved normally
              │
              ▼
     Extract authenticated User ID
       (decoded JWT id or res.userId)
              │
              ▼
   Request Notification Permission
  (default -> request; granted -> proceed; denied -> skip)
              │
              ▼
    Firebase Messaging getToken()
              │
              ▼
    FCM Web Push Token generated
              │
              ▼
PATCH /api/v1/users/{userId}/fcm-token
   (Payload: { "fcmToken": "<token>" })
              │
              ▼
Backend stores fcmToken for user
              │
              ▼
Continue to Dashboard / Application
```

---

## Critical Business Rule: Non-Blocking Execution

**FCM failures must NEVER cause login failure.**

Authentication and FCM registration are completely decoupled. The following events must log development warnings and allow the user to smoothly enter the application without error toasts or interruptions:
- Notification permission denied or closed
- Firebase service unavailable or offline
- Browser does not support Notifications or Service Workers
- Service worker registration failure
- `getToken()` timeout or failure
- Backend `PATCH /users/{userId}/fcm-token` returns 4xx/5xx or network error

---

## Files Created & Modified

### 1. `src/firebase.ts` (Modified)
- Initializes Firebase using environment variables.
- Implements `getFCMToken()`:
  - Validates `window`, `Notification`, and `serviceWorker` support.
  - Checks Firebase `isSupported()`.
  - Handles 3 permission states: `denied` (skip), `default` (request), `granted` (proceed).
  - Registers `/firebase-messaging-sw.js` and awaits `navigator.serviceWorker.ready`.
  - Calls Firebase `getToken()` using `VITE_FIREBASE_VAPID_KEY`.
  - Emits required logging tags:
    - `[FCM] Checking notification support`
    - `[FCM] Notification permission: granted`
    - `[FCM] Token generated`
    - `[FCM] Notification permission denied`
    - `[FCM] Firebase messaging unsupported`
    - `[FCM] Token generation failed`
  - Safely catches all errors and returns `string | null` (never throws).

### 2. `src/firebase/firebase.ts` (Modified)
- Unifies Firebase imports by re-exporting `app`, `getFCMToken`, and `listenForForegroundMessages` from `../firebase`.
- Maintains backward compatibility for existing UI components.

### 3. `src/services/apiClient.ts` (Modified)
- Extended `ApiService` with:
  ```ts
  async updateFcmToken(userId: string | number, fcmToken: string): Promise<{ message?: string; success?: boolean }> {
    return this.request<{ message?: string; success?: boolean }>(`/users/${userId}/fcm-token`, {
      method: 'PATCH',
      body: JSON.stringify({ fcmToken }),
    });
  }
  ```
- **Base URL Guarantee**: Because `this.baseUrl` already contains `/api/v1`, relative path `/users/${userId}/fcm-token` correctly targets `/api/v1/users/{userId}/fcm-token` without duplicating path segments.
- Automatically includes `Authorization: Bearer <accessToken>` and handles errors.

### 4. `src/services/fcmService.ts` (Created / Standardized)
- Exposes `registerFCMToken(userId)` and `saveFCMToken(userId, fcmToken)`.
- Bridges `getFCMToken()` and `api.updateFcmToken(userId, fcmToken)`.
- Emits required logging tags:
  - `[FCM] Registering token for user: <userId>`
  - `[FCM] Token saved successfully`
  - `[FCM] Backend registration failed`
- Safely catches any backend or network errors and returns `false` without throwing.

### 5. `src/context/AppContext.tsx` (Modified)
- Inside the existing `login(username, password)` function:
  - Authenticates user via `api.login()`.
  - Saves JWT token and extracts authenticated `userId` via `decodeJwt(res.accessToken)?.id || res.userId`.
  - Sets `isAuthenticated = true` and `currentUser`.
  - Calls `await registerFCMToken(userId)` inside an isolated `try / catch` block.
  - If login API fails, FCM logic is completely bypassed.

### 6. `public/firebase-messaging-sw.js` (Modified)
- Handles background push notification payloads.
- Added `notificationclick` event listener to focus existing tabs or open application root when clicked.

### 7. `.env.example` (Modified)
- Added all required Firebase and API configuration variables.

---

## Required Environment Variables

```env
# API Base URL
VITE_API_URL="https://household-food-system.onrender.com/api/v1"
VITE_API_BASE_URL="https://household-food-system.onrender.com/api/v1"

# Firebase Web App Credentials
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="1:...:web:..."
VITE_FIREBASE_VAPID_KEY="BBU_..."
```

---

## Firebase Console Configuration Checklist

1. **Project Setup**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Select your project.
2. **Web App**:
   - Under **Project Settings** > **General**, ensure a Web App is registered.
   - Copy `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId` into `.env`.
3. **Cloud Messaging VAPID Key**:
   - Navigate to **Project Settings** > **Cloud Messaging** tab.
   - Scroll down to **Web configuration** > **Web Push certificates**.
   - If no key pair exists, click **Generate key pair**.
   - Copy the generated public key into `VITE_FIREBASE_VAPID_KEY` in `.env`.

---

## Network & DevTools Verification

1. Open Chrome DevTools (`Cmd + Option + I` on Mac, `F12` on Windows/Linux).
2. Go to the **Console** tab.
3. Sign in with valid credentials.
4. When prompted, click **Allow** on browser notifications.
5. Verify Console output sequence:
   ```text
   [FCM] Checking notification support
   [FCM] Notification permission: granted
   [FCM] Token generated
   [FCM] Registering token for user: 1
   [FCM] Token saved successfully
   ```
6. Switch to the **Network** tab:
   - Filter by `fcm-token` or `Fetch/XHR`.
   - Locate the request:
     - **Request URL**: `https://household-food-system.onrender.com/api/v1/users/<id>/fcm-token` (or local proxy `/api/v1/users/<id>/fcm-token`)
     - **Request Method**: `PATCH`
     - **Request Headers**:
       - `Authorization: Bearer <token>`
       - `Content-Type: application/json`
     - **Request Payload**:
       ```json
       {
         "fcmToken": "c1a2b3..."
       }
       ```
     - **Status Code**: `200 OK` or `204 No Content`
