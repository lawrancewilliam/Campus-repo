import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { env } from "$env/dynamic/public";

const firebaseConfig = {
  apiKey: env.PUBLIC_FIREBASE_API_KEY || env.VITE_PUBLIC_FIREBASE_API_KEY || "AIzaSyDYQPWtudsZcEpQXG55YI_kSCB7b8O8mHk",
  authDomain: env.PUBLIC_FIREBASE_AUTH_DOMAIN || env.VITE_PUBLIC_FIREBASE_AUTH_DOMAIN || "campus-reposit.firebaseapp.com",
  projectId: env.PUBLIC_FIREBASE_PROJECT_ID || env.VITE_PUBLIC_FIREBASE_PROJECT_ID || "campus-reposit",
  storageBucket: env.PUBLIC_FIREBASE_STORAGE_BUCKET || env.VITE_PUBLIC_FIREBASE_STORAGE_BUCKET || "campus-reposit.firebasestorage.app",
  messagingSenderId: env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID || env.VITE_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "504238982432",
  appId: env.PUBLIC_FIREBASE_APP_ID || env.VITE_PUBLIC_FIREBASE_APP_ID || "1:504238982432:web:a85d4c6619f5ad9f568345"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);