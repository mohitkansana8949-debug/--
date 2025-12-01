
/// <reference lib="webworker" />
import type { PrecacheEntry } from "@serwist/precaching";
import { installSerwist } from "@serwist/sw";
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";
import { firebaseConfig } from "@/firebase/config";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

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


installSerwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/image"),
      handler: "CacheFirst",
      options: {
        cacheName: "next-image",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|ico|webp)$/,
        handler: "CacheFirst",
        options: {
            cacheName: "image-cache",
            expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
        },
    },
    {
      urlPattern: ({ url }) => url.hostname.includes("i.supaimg.com"),
      handler: "CacheFirst",
      options: {
        cacheName: "supaimg-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        },
      },
    },
    {
      urlPattern: ({ url }) => url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com"),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
  ],
});
