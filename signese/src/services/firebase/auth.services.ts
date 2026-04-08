import { auth, db } from "./firebase.config";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { DEFAULT_PROFILE_ICON_ID } from "@/src/features/account/types";

const INITIAL_STARS_BALANCE = 5;

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
      avatar: DEFAULT_PROFILE_ICON_ID,
      profileIcons: {
        selectedIcon: DEFAULT_PROFILE_ICON_ID,
        unlockedIconIds: [DEFAULT_PROFILE_ICON_ID],
      },
      stars: {
        balance: INITIAL_STARS_BALANCE,
        lifetimeEarned: INITIAL_STARS_BALANCE,
        lifetimeSpent: 0,
      },
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

export async function updateUserAvatar(uid: string, avatar: string) {
  await setDoc(
    doc(db, "users", uid),
    {
      avatar,
    },
    { merge: true }
  );
}

const USERNAME_MIN = 2;

export async function updateUserUsername(user: User, username: string) {
  const trimmed = username.trim();
  if (trimmed.length < USERNAME_MIN) {
    throw new Error(`Username must be at least ${USERNAME_MIN} characters.`);
  }

  await updateProfile(user, { displayName: trimmed });

  await setDoc(
    doc(db, "users", user.uid),
    {
      username: trimmed,
      email: user.email ?? null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function updateAccountEmail(user: User, newEmailRaw: string, currentPassword: string) {
  const liveUser = auth.currentUser;
  if (!liveUser || liveUser.uid !== user.uid) {
    throw new Error("Session expired. Please sign in again.");
  }

  const signInEmail = liveUser.email;
  if (!signInEmail) {
    throw new Error("No email on file for this account.");
  }

  const newEmail = newEmailRaw.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(newEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  if (newEmail === signInEmail.trim().toLowerCase()) {
    throw new Error("That is already your current email.");
  }

  // Must match the email Firebase has for this password provider (canonical casing)
  const credential = EmailAuthProvider.credential(signInEmail, currentPassword);
  await reauthenticateWithCredential(liveUser, credential);

  // Direct updateEmail() is blocked when "Email enumeration protection" is on (default for many
  // new Firebase projects). verifyBeforeUpdateEmail sends a link to the new address; Auth + Firestore
  // update after the user confirms (we sync Firestore from Auth on next loadProfile).
  await verifyBeforeUpdateEmail(liveUser, newEmail);
}

/**
 * If Firebase Auth email differs from Firestore (e.g. user completed verifyBeforeUpdateEmail),
 * merge the Auth email into users/{uid} so the profile doc stays aligned.
 */
export async function syncFirestoreUserEmailIfNeeded(
  uid: string,
  authEmail: string | null | undefined,
  firestoreEmail: string | null | undefined
): Promise<void> {
  const authNorm = authEmail?.trim().toLowerCase() ?? "";
  if (!authNorm) return;

  const docNorm =
    typeof firestoreEmail === "string" && firestoreEmail.trim() !== ""
      ? firestoreEmail.trim().toLowerCase()
      : "";

  if (docNorm === authNorm) return;

  try {
    await setDoc(
      doc(db, "users", uid),
      {
        email: authEmail!.trim(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.warn("syncFirestoreUserEmailIfNeeded", e);
  }
}

export async function updateAccountPassword(
  user: User,
  currentPassword: string,
  newPassword: string
) {
  const liveUser = auth.currentUser;
  if (!liveUser || liveUser.uid !== user.uid) {
    throw new Error("Session expired. Please sign in again.");
  }

  const email = liveUser.email;
  if (!email) {
    throw new Error("No email on file for this account.");
  }

  if (newPassword.length < 6) {
    throw new Error("Password should be at least 6 characters.");
  }

  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(liveUser, credential);
  await updatePassword(liveUser, newPassword);
  try {
    await liveUser.reload();
  } catch {
    // Non-fatal; AuthUserContext also tolerates reload failures
  }
}

export function mapAuthErrorCode(code: string): string {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/requires-recent-login":
      return "Please sign out and sign in again, then try again.";
    case "auth/email-already-in-use":
      return "That email is already in use.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/operation-not-allowed":
      return "Firebase blocked this sign-in method or flow. For email changes, the app uses a verification link; if you still see this, check Authentication → Sign-in method or disable Email enumeration protection in project settings.";
    case "auth/user-token-expired":
    case "auth/user-disabled":
      return "Your session is no longer valid. Please sign in again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

/** True if the user can reauthenticate with email + password (not OAuth-only). */
export function userHasPasswordProvider(user: User | null): boolean {
  if (!user) return false;
  return user.providerData.some((p) => p.providerId === "password");
}

export function getAuthErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = String((err as { code: string }).code);
    if (code === "permission-denied") {
      return "Firestore denied this action. In Firebase Console → Firestore → Rules, allow the signed-in user to read and write documents at users/{theirUid} (see firestore.rules in this repo).";
    }
    if (code.startsWith("auth/")) {
      return mapAuthErrorCode(code);
    }
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}