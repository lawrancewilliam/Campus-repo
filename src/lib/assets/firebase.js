import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDYQPWtudsZcEpQXG55YI_kSCB7b8O8mHk",
  authDomain: "campus-reposit.firebaseapp.com",
  projectId: "campus-reposit",
  storageBucket: "campus-reposit.firebasestorage.app",
  messagingSenderId: "504238982432",
  appId: "1:504238982432:web:a85d4c6619f5ad9f568345"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);