importScripts(
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyAGgBqyhpqX3PdKsxuJU5cSxuqsjoYmP14",
    authDomain: "household-notification.firebaseapp.com",
    projectId: "household-notification",
    storageBucket: "household-notification.firebasestorage.app",
    messagingSenderId: "63861799488",
    appId: "1:63861799488:web:722be67b13cc6bcf8dbda5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log(
        "[firebase-messaging-sw.js] Background message:",
        payload
    );


    const notification = payload.notification || {};
    const data = payload.data || {};

    const title =
        notification.title ||
        data.title ||
        "Household Food";

    const body =
        notification.body ||
        data.body ||
        "";

    self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.ico",
        data: data,
    });
});

self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    event.waitUntil(
        clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then(function (clientList) {
                if (clientList.length > 0) {
                    let client = clientList[0];
                    for (let i = 0; i < clientList.length; i++) {
                        if (clientList[i].focused) {
                            return clientList[i];
                        }
                    }
                    return client.focus();
                }
                return clients.openWindow("/");
            })
    );
});