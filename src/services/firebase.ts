import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAzroCv2oISN930vZ45wSlYzJZgz_O-Hps",
  authDomain: "kapak-3af75.firebaseapp.com",
  projectId: "kapak-3af75",
  storageBucket: "kapak-3af75.firebasestorage.app",
  messagingSenderId: "798236936893",
  appId: "1:798236936893:web:814d9f5585db3fde0cc5d4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();