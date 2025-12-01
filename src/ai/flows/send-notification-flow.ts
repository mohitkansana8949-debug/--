
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { User } from '@/lib/types';


function initializeAdminApp() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    console.error("Firebase Admin SDK service account is not set in environment variables.");
    return false;
  }
  try {
     // Check if the default app is already initialized
    if (getApps().some(app => app.name === '[DEFAULT]')) {
      return true;
    }
    initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    });
    return true;
  } catch (error: any) {
     if (error.code === 'app/duplicate-app') {
      return true; // App is already initialized
    }
    console.error("Failed to initialize Firebase Admin SDK:", error);
    return false;
  }
}


const NotificationInputSchema = z.object({
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().optional(),
});
export type NotificationInput = z.infer<typeof NotificationInputSchema>;

const NotificationOutputSchema = z.object({
  success: z.boolean(),
  successCount: z.number(),
  failureCount: z.number(),
  error: z.string().optional(),
});
export type NotificationOutput = z.infer<typeof NotificationOutputSchema>;

export async function sendNotificationFlow(input: NotificationInput): Promise<NotificationOutput> {
  return await notificationFlow(input);
}

const notificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: NotificationInputSchema,
    outputSchema: NotificationOutputSchema,
  },
  async ({ title, body, imageUrl }) => {
    const isAdminAppInitialized = initializeAdminApp();
    if (!isAdminAppInitialized) {
        const errorMsg = "Firebase Admin SDK is not initialized. Cannot send notifications. Ensure service account is configured.";
        console.error(errorMsg);
        return {
            success: false,
            successCount: 0,
            failureCount: 0,
            error: errorMsg,
        };
    }
    const { firestore } = initializeFirebase();

    try {
      // 1. Fetch all users who have an FCM token
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('fcmToken', '!=', null));
      const usersSnapshot = await getDocs(q);

      const tokens = usersSnapshot.docs
        .map(doc => (doc.data() as User).fcmToken)
        .filter((token): token is string => !!token);
      
      if (tokens.length === 0) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          error: "No users have subscribed to notifications.",
        };
      }

      // 2. Send multicast message
      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        tokens: tokens,
        webpush: {
          fcmOptions: {
            link: '/', // Link to open when notification is clicked
          },
        },
      };

      const response = await getMessaging().sendEachForMulticast(message);
      
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };

    } catch (e: any) {
      console.error("Error in sendNotificationFlow:", e);
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        error: e.message || "An unexpected error occurred.",
      };
    }
  }
);
