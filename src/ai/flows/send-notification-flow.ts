
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import admin from 'firebase-admin';
import { User } from '@/lib/types';
import { config } from 'dotenv';

config();


function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }
  
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error("Firebase Admin SDK service account is not set in environment variables (FIREBASE_SERVICE_ACCOUNT).");
    }
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountString);
    } catch (parseError: any) {
      throw new Error(`Failed to parse FIREBASE_SERVICE_ACCOUNT JSON: ${parseError.message}`);
    }

    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
    console.error("Failed to initialize Firebase Admin SDK:", error.message);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
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
    
    try {
      initializeAdminApp();
      const { firestore } = initializeFirebase();

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

      const message = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        tokens: tokens,
        webpush: {
          fcmOptions: {
            link: '/', 
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
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
