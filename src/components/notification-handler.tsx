
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useFirebase, useUser } from '@/firebase';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
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
          const settingsDocRef = doc(firestore, 'settings', 'app');
          const settingsDoc = await getDoc(settingsDocRef);
          const vapidKey = settingsDoc.data()?.vapidKey || process.env.NEXT_PUBLIC_VAPID_KEY;

          if (!vapidKey) {
            console.error("VAPID key is not set in environment variables (NEXT_PUBLIC_VAPID_KEY) or Firestore settings.");
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Notification service is not configured correctly.' });
            return;
          }
          
          const messaging = getMessaging(firebaseApp);
          const currentToken = await getToken(messaging, { 
            vapidKey: vapidKey,
          });

          if (currentToken) {
            const userDocRef = doc(firestore, 'users', user.uid);
            // setDoc instead of updateDoc to create if not exists
            await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
            // Optionally, inform the user only if it's a new token setup
            // toast({ title: 'Notifications Enabled', description: 'You will now receive notifications.' });
          } else {
            console.log('No registration token available. Request permission to generate one.');
             toast({ variant: 'destructive', title: 'Token Error', description: 'Could not retrieve notification token.' });
          }
        } else {
            console.log('Notification permission not granted.');
            const userDocRef = doc(firestore, 'users', user.uid);
            await setDoc(userDocRef, { fcmToken: null }, { merge: true });
            // toast({ variant: 'destructive', title: 'Permission Denied', description: 'You have not granted permission for notifications.' });
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
