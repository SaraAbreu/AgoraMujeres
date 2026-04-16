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

// Función para iniciar sesión con Google y obtener el id_token
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.idToken;
    const user = result.user;
    return { token, user };
  } catch (error) {
    throw error;
  }
}
