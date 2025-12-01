
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FirebaseError } from 'firebase/app';

export function NotificationHandler() {
  const { firebaseApp, firestore } = useFirebase();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    const setupNotifications = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !firebaseApp || !user || !firestore) {
        return;
      }
      
      const isBrowserSupported = await isSupported();
      if (!isBrowserSupported) {
          console.log("This browser does not support Firebase Messaging.");
          return;
      }

      try {
        const messaging = getMessaging(firebaseApp);
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
          if (!vapidKey) {
            console.error("VAPID key is not set in environment variables.");
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Cannot enable notifications due to a server configuration issue.' });
            return;
          }
          
          // Explicitly register the service worker
          const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

          const currentToken = await getToken(messaging, { vapidKey: vapidKey, serviceWorkerRegistration: swRegistration });

          if (currentToken) {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { fcmToken: currentToken });
            toast({ title: 'Notifications Enabled!' });
          } else {
            console.log('No registration token available. Request permission to generate one.');
            toast({ variant: 'destructive', title: 'Could not get token', description: 'Please ensure notifications are not blocked for this site.' });
          }
        } else {
          toast({ variant: 'destructive', title: 'Permission Denied', description: 'You will not receive notifications.' });
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
