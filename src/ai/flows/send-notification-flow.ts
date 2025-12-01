
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDB, adminMessaging } from '@/lib/firebaseAdmin';
import { firestore } from 'firebase-admin';

interface User {
  fcmToken?: string | null;
  // other user properties
}

const NotificationInputSchema = z.object({
  title: z.string(),
  body: z.string(),
  imageUrl: z.string().url().optional().or(z.literal('')),
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
      // 1. Save notification to a global collection for history
      const notificationHistoryRef = adminDB.collection('notifications').doc();
      await notificationHistoryRef.set({
        title,
        body,
        imageUrl: imageUrl || "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // 2. Fetch all users who have a valid FCM token
      const usersRef = adminDB.collection('users');
      const usersSnapshot = await usersRef.where('fcmToken', '!=', null).get();

      if (usersSnapshot.empty) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          error: "No users have subscribed to notifications.",
        };
      }

      const tokens = usersSnapshot.docs
        .map(doc => (doc.data() as User).fcmToken)
        .filter((token): token is string => !!token && typeof token === 'string' && token.length > 0);
      
      if (tokens.length === 0) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          error: "No users with valid tokens found.",
        };
      }
      
      // 3. Send notifications to all valid tokens
      const message = {
          notification: {
            title,
            body,
            imageUrl: imageUrl || "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
          },
           webpush: {
            notification: {
              icon: "https://i.supaimg.com/6f2c48a1-5943-4025-9203-d0712fa34d7b.jpg",
            },
            fcmOptions: {
              link: '/', 
            },
          },
          tokens: tokens,
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      
      const successCount = response.successCount;
      const failureCount = response.failureCount;

      return {
        success: failureCount === 0,
        successCount: successCount,
        failureCount: failureCount,
      };

    } catch (e: any) {
      console.error("Error in sendNotificationFlow:", e);
      let errorMessage = e.message || "An unexpected error occurred.";
       if (e.code === 'messaging/invalid-argument') {
        errorMessage = "Invalid argument provided to messaging service. Check tokens and message payload.";
      }
      
      return {
        success: false,
        successCount: 0,
        failureCount: 0,
        error: errorMessage,
      };
    }
  }
);
