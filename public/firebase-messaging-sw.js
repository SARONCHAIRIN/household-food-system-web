importScripts(
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    // apiKey: "BBU_TzSB6vglimaTwTRjZvxq14yjs5RlQtAA_qGvlq4Y7xxadvJuL4UVenwPmd3K1nmUBOtFZFKw1i0CfBMinPU",
    apiKey: "AIzaSyAGgBqyhpqX3PdKsxuJU5cSxuqsjoYmP14",
    authDomain: "household-notification.firebaseapp.com",
    projectId: "household-notification",
    storageBucket: "household-notification.firebasestorage.app",
    messagingSenderId: "63861799488",
    appId: "1:63861799488:web:722be67b13cc6bcf8dbda5"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
    console.log(
        "[firebase-messaging-sw.js] Background message",
        payload
    );

    var title = "Household Food";
    var body = "";

    if (
        payload &&
        payload.notification &&
        payload.notification.title
    ) {
        title = payload.notification.title;
    }

    if (
        payload &&
        payload.notification &&
        payload.notification.body
    ) {
        body = payload.notification.body;
    }

    self.registration.showNotification(title, {
        body: body,
        icon: "/favicon.ico"
    });
});