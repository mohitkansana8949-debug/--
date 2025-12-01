
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

export function NotificationHandler() {
  const { firebaseApp, firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const setupNotifications = async () => {
      if (typeof window === 'undefined' || !firebaseApp || !user || !firestore) {
        return;
      }
      
      const isBrowserSupported = await isSupported();
      if (!isBrowserSupported) {
          console.log("This browser does not support Firebase Messaging.");
          return;
      }

      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
          if (!vapidKey) {
            console.error("VAPID key is not set in environment variables (NEXT_PUBLIC_VAPID_KEY).");
            return;
          }
          
          const messaging = getMessaging(firebaseApp);
          const currentToken = await getToken(messaging, { 
            vapidKey: vapidKey,
          });

          if (currentToken) {
            const userDocRef = doc(firestore, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            // Only update if the token is new or different
            if (userDoc.exists() && userDoc.data().fcmToken !== currentToken) {
                await updateDoc(userDocRef, { fcmToken: currentToken });
            }
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
            console.log('Notification permission not granted.');
        }
      } catch (error: any) {
        console.error('An error occurred while retrieving token. ', error);
        let description = 'Could not enable notifications. Please try again later.';
        if (error instanceof FirebaseError) {
            description = error.message;
        }
        toast({ variant: 'destructive', title: 'Notification Error', description });
      }
    };

    setupNotifications();
  }, [firebaseApp, user, firestore, toast]);

  // This component does not render anything.
  return null;
}
