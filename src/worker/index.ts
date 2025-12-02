/// <reference lib="webworker" />

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseConfig } from "@/firebase/config";

declare const self: ServiceWorkerGlobalScope;

// Initialize Firebase app if not already initialized
if (!getApps().length) {
    initializeApp(firebaseConfig);
}

const messaging = getMessaging();

onBackgroundMessage(messaging, (payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || 'https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


// Simple pass-through for other events
self.addEventListener('fetch', (event) => {
  // You can add custom fetch handling here if needed
});

self.addEventListener('push', (event) => {
  // Default push handling if onBackgroundMessage doesn't cover it
});
