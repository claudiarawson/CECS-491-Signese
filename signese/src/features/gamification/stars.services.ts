import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "@/src/services/firebase/firebase.config";
import type { UserStars } from "./types";

const DEFAULT_STARS: UserStars = {
  balance: 0,
  lifetimeEarned: 0,
  lifetimeSpent: 0,
};

// Get current user's stars
export async function getCurrentUserStars(): Promise<UserStars> {
  const user = auth.currentUser;
  if (!user) return DEFAULT_STARS;

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data() as { stars?: Partial<UserStars> } | undefined;
  const stars = data?.stars;

  return {
    balance: typeof stars?.balance === "number" ? stars.balance : 0,
    lifetimeEarned:
      typeof stars?.lifetimeEarned === "number"
        ? stars.lifetimeEarned
        : 0,
    lifetimeSpent:
      typeof stars?.lifetimeSpent === "number"
        ? stars.lifetimeSpent
        : 0,
  };
}

// Ensure stars exist in Firestore
export async function ensureStarsDocument(): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(
    doc(db, "users", user.uid),
    {
      stars: DEFAULT_STARS,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Spend stars safely (prevents race conditions)
export async function spendStarsForCurrentUser(
  amount: number
): Promise<UserStars> {
  const user = auth.currentUser;
  if (!user) throw new Error("You must be signed in.");
  if (amount <= 0) throw new Error("Invalid star amount.");

  const userRef = doc(db, "users", user.uid);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const data = snap.data() as { stars?: Partial<UserStars> } | undefined;

    const balance =
      typeof data?.stars?.balance === "number"
        ? data.stars.balance
        : 0;

    const lifetimeEarned =
      typeof data?.stars?.lifetimeEarned === "number"
        ? data.stars.lifetimeEarned
        : 0;

    const lifetimeSpent =
      typeof data?.stars?.lifetimeSpent === "number"
        ? data.stars.lifetimeSpent
        : 0;

    if (balance < amount) {
      throw new Error("Not enough stars.");
    }

    const updated: UserStars = {
      balance: balance - amount,
      lifetimeEarned,
      lifetimeSpent: lifetimeSpent + amount,
    };

    transaction.set(
      userRef,
      {
        stars: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return updated;
  });
}
export async function addStarsToCurrentUser(
  amount: number
): Promise<UserStars> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in.");
  }

  if (amount <= 0) {
    throw new Error("Invalid star amount.");
  }

  const userRef = doc(db, "users", user.uid);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const data = snap.data() as { stars?: Partial<UserStars> } | undefined;

    const balance =
      typeof data?.stars?.balance === "number"
        ? data.stars.balance
        : 0;

    const lifetimeEarned =
      typeof data?.stars?.lifetimeEarned === "number"
        ? data.stars.lifetimeEarned
        : 0;

    const lifetimeSpent =
      typeof data?.stars?.lifetimeSpent === "number"
        ? data.stars.lifetimeSpent
        : 0;

    const updated: UserStars = {
      balance: balance + amount,
      lifetimeEarned: lifetimeEarned + amount,
      lifetimeSpent,
    };

    transaction.set(
      userRef,
      {
        stars: updated,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return updated;
  });
}