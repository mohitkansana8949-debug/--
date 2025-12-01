
// This file must be in the public directory

importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker by passing in the messagingSenderId
const firebaseConfig = {
  apiKey: "AIzaSyCphHPt-0mfUZ-RHtlNrff9FZTE-_RmFSk",
  authDomain: "studio-1787090978-7ccfd.firebaseapp.com",
  projectId: "studio-1787090978-7ccfd",
  storageBucket: "studio-1787090978-7ccfd.appspot.com",
  messagingSenderId: "433819063676",
  appId: "1:433819063676:web:458e7cb7a5b6e6ac4200f9"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
