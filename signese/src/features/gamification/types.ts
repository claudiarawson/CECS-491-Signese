export type UserStars = {
  balance: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
};

/** Snapshot shape for progress UI / API-style consumers (maps to Firestore user doc). */
export type UserStarsProgress = {
  userId: string;
  totalStars: number;
  balance: number;
  updatedAt: string;
};