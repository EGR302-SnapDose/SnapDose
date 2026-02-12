import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-LF35aYV1PU6GeeWDSqcmOsOj0SqZYd8",
  authDomain: "egr302-snapdose.firebaseapp.com",
  projectId: "egr302-snapdose",
  storageBucket: "egr302-snapdose.firebasestorage.app",
  messagingSenderId: "1044774150297",
  appId: "1:1044774150297:web:0f7bc4aa81b4cab7395808",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
