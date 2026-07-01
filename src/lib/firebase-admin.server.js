import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { 
    FIREBASE_PROJECT_ID, 
    FIREBASE_STORAGE_BUCKET 
} from '$env/static/private';
import { env } from '$env/dynamic/private';

const clientEmail = env.FIREBASE_CLIENT_EMAIL || '';
// Replace escaped newlines in private key
const privateKey = env.FIREBASE_PRIVATE_KEY 
    ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : '';

let app;

if (getApps().length === 0) {
    if (clientEmail && privateKey) {
        try {
            app = initializeApp({
                credential: cert({
                    projectId: FIREBASE_PROJECT_ID,
                    clientEmail,
                    privateKey
                }),
                storageBucket: FIREBASE_STORAGE_BUCKET
            });
            console.log('✅ Firebase Admin SDK initialized successfully with service account cert.');
        } catch (err) {
            console.error('❌ Failed to initialize Firebase Admin SDK with cert:', err);
        }
    } else {
        console.warn('⚠️ FIREBASE_CLIENT_EMAIL and/or FIREBASE_PRIVATE_KEY are missing from env. Fallback configuration initialized.');
        try {
            app = initializeApp({
                projectId: FIREBASE_PROJECT_ID,
                storageBucket: FIREBASE_STORAGE_BUCKET
            });
            console.log('✅ Firebase Admin SDK initialized using default credentials or project settings.');
        } catch (err) {
            console.error('❌ Failed to initialize Firebase Admin SDK fallback:', err);
        }
    }
} else {
    app = getApps()[0];
}

// Export admin Firestore and Storage instances using modern modular endpoints
export const adminDb = app ? getFirestore(app) : null;
export const adminStorage = app ? getStorage(app) : null;
export { cert };
