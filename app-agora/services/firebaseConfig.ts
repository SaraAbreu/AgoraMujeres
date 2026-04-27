import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBMKRBscuqSx1nSXZPmrPr1qXXNkuoYl4Y",
  authDomain: "agora-mujeres.firebaseapp.com",
  projectId: "agora-mujeres",
  storageBucket: "agora-mujeres.appspot.com",
  messagingSenderId: "835701676611",
  appId: "1:835701676611:web:782236d4ad332951ca52f6",
  measurementId: "G-8CYQGNZ5X2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

// Tipo explícito — TypeScript sabe que siempre devuelve { token, user }
export async function signInWithGoogle(): Promise<{ token: string; user: any }> {
  const result = await signInWithPopup(auth, provider);
  const token = await result.user.getIdToken();
  return { token, user: result.user };
}

// Stub para no romper importaciones en login.tsx
export async function getGoogleRedirectResult(): Promise<{ token: string; user: any } | null> {
  return null;
}