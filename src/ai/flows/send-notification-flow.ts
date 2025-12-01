
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { adminDB, adminMessaging } from '@/lib/firebaseAdmin';

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
        .filter((token): token is string => !!token);
      
      if (tokens.length === 0) {
        return {
          success: true,
          successCount: 0,
          failureCount: 0,
          error: "No users with valid tokens found.",
        };
      }
      
      const message: admin.messaging.MulticastMessage = {
        notification: {
          title,
          body,
          ...(imageUrl && { imageUrl }),
        },
        tokens,
        webpush: {
          fcmOptions: {
            link: '/', 
          },
        },
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      
      return {
        success: response.failureCount === 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
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
