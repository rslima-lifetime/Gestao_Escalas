import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVWzODTbwgvRI8VNlsLhs99kVm5JKBFrQ",
  authDomain: "gestao-de-escala-76a5c.firebaseapp.com",
  projectId: "gestao-de-escala-76a5c",
  storageBucket: "gestao-de-escala-76a5c.firebasestorage.app",
  messagingSenderId: "282995068094",
  appId: "1:282995068094:web:b06dd7653b9a0ddee2a2ef",
  measurementId: "G-VYCNNR574Y"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
