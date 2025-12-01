// This file is server-only. Do not use 'use client' here.
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountString) {
      throw new Error("Firebase Admin SDK service account is not set in environment variables (FIREBASE_SERVICE_ACCOUNT).");
    }
    
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (error: any) {
     console.error("Firebase Admin SDK initialization failed:", error.message);
     // We throw an error here to make it clear that the admin features will not work.
     // This helps in debugging issues related to environment variables or malformed JSON.
     throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

export const adminDB = admin.firestore();
export const adminMessaging = admin.messaging();
