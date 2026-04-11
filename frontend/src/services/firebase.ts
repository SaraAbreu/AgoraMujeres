import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // 1. Importamos la base de datos

const firebaseConfig = {
  apiKey: "AIzaSyBMKRBscuqSx1nSXZPmrPr1qXXNkuoYl4Y",
  authDomain: "agora-mujeres.firebaseapp.com",
  projectId: "agora-mujeres",
  storageBucket: "agora-mujeres.firebasestorage.app",
  messagingSenderId: "835701676611",
  appId: "1:835701676611:web:782236d4ad332951ca52f6",
  measurementId: "G-8CYQGNZ5X2"
};

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializamos y exportamos Firestore para usarlo en el diario
export const db = getFirestore(app);

// Exportamos lo que usaremos en la pantalla de Login
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();