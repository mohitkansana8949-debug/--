
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function NotificationHandler() {
  const { firebaseApp, firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && firebaseApp && user) {
      const requestPermission = async () => {
        try {
          const messaging = getMessaging(firebaseApp);
          
          // Check if permission was already granted
          if (Notification.permission !== 'granted') {
             const permission = await Notification.requestPermission();
             if (permission !== 'granted') {
                toast({ variant: 'destructive', title: 'Notification permission denied.' });
                return;
             }
          }
          
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
          if (!vapidKey) {
              console.error("VAPID key is not set in environment variables.");
              return;
          }

          const currentToken = await getToken(messaging, { vapidKey });
          
          if (currentToken) {
            // Save the token to the user's document in Firestore
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { fcmToken: currentToken });
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } catch (error) {
          console.error('An error occurred while retrieving token. ', error);
          toast({ variant: 'destructive', title: 'Could not enable notifications.', description: 'Please try again later.' });
        }
      };

      // This could be triggered by a user action, e.g., clicking a button.
      // For this implementation, we'll try to get it on component mount if permission is already granted.
      if (Notification.permission === 'granted') {
        requestPermission();
      }
      
      // The `requestPermission` function can be exported or tied to a UI element
      // for the user to explicitly enable notifications if they haven't already.
      // Example: A button with onClick={requestPermission}

    }
  }, [firebaseApp, user, firestore, toast]);

  // This component does not render anything.
  return null;
}
