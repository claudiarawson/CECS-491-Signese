import { auth, db } from "./firebase.config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export async function signUpWithEmail(email: string, password: string, username: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  try {
    await updateProfile(user, { displayName: username });
  } catch (err) {
    console.warn("updateProfile non-fatal", err);
  }

  try {
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: user.email,
      username,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("User document write failed; continuing login", err);
  }

  return credential;
}

export async function signInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function signOutUser() {
  return signOut(auth);
}

export async function getUserProfile(uid: string) {
  try {
    const docSnap = await getDoc(doc(db, "users", uid));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (err) {
    console.warn("Offline profile read", err);
    return null;
  }
}