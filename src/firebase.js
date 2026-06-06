import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDxKkavQRw4og0Xedn1658A1hEcMYo8vaA",
  authDomain: "sempilot-7497b.firebaseapp.com",
  projectId: "sempilot-7497b",
  storageBucket: "sempilot-7497b.firebasestorage.app",
  messagingSenderId: "396582792481",
  appId: "1:396582792481:web:d27f276f8a0a63a3b3a260"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
