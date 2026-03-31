import { auth, db } from "@/src/services/firebase/firebase.config";
import {
  Timestamp,
  doc,
  runTransaction,
  serverTimestamp,
  type FieldValue,
} from "firebase/firestore";

type DateKey = `${number}-${number}-${number}`;

export type UserStreak = {
  current: number;
  longest: number;
  lastLoginDate: DateKey;
  lastLoginAt?: Timestamp | FieldValue;
};

type UserDocShape = {
  streak?: Partial<UserStreak>;
};

function getLocalDateKey(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterday(date: Date): Date {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
}

export async function updateLoginStreakForCurrentUser(): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const now = new Date();
  const todayKey = getLocalDateKey(now);
  const yesterdayKey = getLocalDateKey(getYesterday(now));

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(userRef);
    const userData = (snap.data() as UserDocShape | undefined) ?? {};
    const streak = userData.streak ?? {};

    const previousCurrent = typeof streak.current === "number" ? streak.current : 0;
    const previousLongest = typeof streak.longest === "number" ? streak.longest : 0;
    const lastLoginDate = streak.lastLoginDate;

    let current: number;
    if (lastLoginDate === todayKey) {
      current = previousCurrent > 0 ? previousCurrent : 1;
    } else if (lastLoginDate === yesterdayKey) {
      current = Math.max(previousCurrent, 0) + 1;
    } else {
      current = 1;
    }

    const longest = Math.max(previousLongest, current);

    const nextStreak: UserStreak = {
      current,
      longest,
      lastLoginDate: todayKey,
      lastLoginAt: serverTimestamp(),
    };

    transaction.set(
      userRef,
      {
        streak: nextStreak,
      },
      { merge: true }
    );
  });
}
