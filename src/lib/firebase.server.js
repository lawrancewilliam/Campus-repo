import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { env } from '$env/dynamic/private';

const firebaseConfig = {
    apiKey: env.FIREBASE_API_KEY,
    authDomain: env.FIREBASE_AUTH_DOMAIN,
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
    appId: env.FIREBASE_APP_ID
};

// Ensure we don't crash if configuration is not filled in yet (placeholders are active)
const isConfigured = env.FIREBASE_API_KEY && !env.FIREBASE_API_KEY.includes('YOUR_FIREBASE_API_KEY_HERE');

if (!isConfigured) {
    console.warn('⚠️ Firebase credentials are using placeholders. Please update your .env file with actual credentials.');
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
