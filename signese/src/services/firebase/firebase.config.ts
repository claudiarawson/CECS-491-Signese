// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDhPh-dagNhStd7j5BVYXBSNqoP3DCzUQY",
  authDomain: "signese-56a7c.firebaseapp.com",
  projectId: "signese-56a7c",
  storageBucket: "signese-56a7c.firebasestorage.app",
  messagingSenderId: "135650697112",
  appId: "1:135650697112:web:8908b052856646e9bc95ed",
  measurementId: "G-CMCDP6PSMX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);