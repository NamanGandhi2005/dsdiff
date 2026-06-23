import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your web app's Firebase configuration
// IMPORTANT: Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBUECB1BUy4eIwpJYCfvJTqoSxl7x9CDRw",
  authDomain: "dsa-notes-app.firebaseapp.com",
  projectId: "dsa-notes-app",
  storageBucket: "dsa-notes-app.firebasestorage.app",
  messagingSenderId: "936828019279",
  appId: "1:936828019279:web:3a8fac9210b3e0578b803a",
  measurementId: "G-TT8PGT5VKT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app); // Initialize Firebase Functions

const googleProvider = new GoogleAuthProvider();
const emailProvider = new EmailAuthProvider(); // Not directly used like this, but good to have if needed

// Helper to call Firebase Functions
const callFirebaseFunction = (functionName, data) => {
  const func = httpsCallable(functions, functionName);
  return func(data);
};

export { auth, db, googleProvider, callFirebaseFunction, functions };