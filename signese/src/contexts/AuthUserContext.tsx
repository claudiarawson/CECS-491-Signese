import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/src/services/firebase/firebase.config";
import { doc, onSnapshot } from "firebase/firestore";
import {
  getUserProfile,
  updateUserAvatar,
  syncFirestoreUserEmailIfNeeded,
} from "@/src/services/firebase/auth.services";
import { updateLoginStreakForCurrentUser } from "@/src/services/streak.service";
import { DEFAULT_PROFILE_ICON_ID } from "@/src/features/account/types";
import { ensureStarsDocument } from "@/src/features/gamification/stars.services";
import type { UserStars } from "@/src/features/gamification/types";

type ProfileStreak = {
  current: number;
  longest: number;
  lastLoginDate?: string;
};

type ProfileStars = UserStars;

type Profile = {
  uid: string;
  username: string;
  email: string;
  avatar: string;
  streak: ProfileStreak;
  stars: ProfileStars;
} | null;

type AuthContextType = {
  authUser: User | null;
  profile: Profile;
  loading: boolean;
  setProfileAvatar: (avatar: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEFAULT_AVATAR = DEFAULT_PROFILE_ICON_ID;

function streakFromDoc(data: Record<string, unknown> | null | undefined): ProfileStreak {
  const s = data?.streak as Record<string, unknown> | undefined;
  return {
    current: typeof s?.current === "number" ? s.current : 0,
    longest: typeof s?.longest === "number" ? s.longest : 0,
    lastLoginDate: typeof s?.lastLoginDate === "string" ? s.lastLoginDate : undefined,
  };
}

function starsFromDoc(data: Record<string, unknown> | null | undefined): ProfileStars {
  const s = data?.stars as Partial<UserStars> | undefined;
  return {
    balance: typeof s?.balance === "number" ? s.balance : 0,
    lifetimeEarned: typeof s?.lifetimeEarned === "number" ? s.lifetimeEarned : 0,
    lifetimeSpent: typeof s?.lifetimeSpent === "number" ? s.lifetimeSpent : 0,
  };
}

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  loading: true,
  setProfileAvatar: async () => {},
  refreshProfile: async () => {},
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  const streakUpdatedForUid = useRef<Set<string>>(new Set());

  const loadProfile = useCallback(async (user: User | null) => {
    if (!user) {
      setProfile(null);
      return;
    }

    let freshUser = user;
    try {
      await user.reload();
      freshUser = auth.currentUser ?? user;
    } catch (reloadErr) {
      console.warn("user.reload() skipped or failed", reloadErr);
      freshUser = auth.currentUser ?? user;
    }

    try {
      const data = await getUserProfile(freshUser.uid);
      const fallbackUsername = freshUser.displayName?.trim() || "User";
      const firestoreEmail =
        typeof data?.email === "string" && data.email.trim() !== "" ? data.email.trim() : null;

      await syncFirestoreUserEmailIfNeeded(freshUser.uid, freshUser.email, firestoreEmail);

      const streak = streakFromDoc(data as Record<string, unknown> | undefined);
      const stars = starsFromDoc(data as Record<string, unknown> | undefined);

      setProfile((prev) => {
        const sameUser = prev?.uid === freshUser.uid;
        const fromDoc = data?.avatar as string | undefined;
        return {
          uid: freshUser.uid,
          username: (data?.username as string | undefined)?.trim() || fallbackUsername,
          email: freshUser.email ?? firestoreEmail ?? (sameUser ? prev?.email ?? "" : ""),
          avatar:
            (fromDoc && fromDoc.trim() !== "" ? fromDoc : undefined) ??
            (sameUser ? prev?.avatar : undefined) ??
            DEFAULT_AVATAR,
          streak,
          stars: sameUser ? { ...prev!.stars, ...stars } : stars,
        };
      });
    } catch (error) {
      console.warn("Failed to load user profile", error);

      setProfile((prev) => {
        const sameUser = prev?.uid === freshUser.uid;
        return {
          uid: freshUser.uid,
          username:
            freshUser.displayName?.trim() || (sameUser ? prev?.username : undefined) || "User",
          email: freshUser.email ?? (sameUser ? prev?.email ?? "" : ""),
          avatar: sameUser && prev?.avatar ? prev.avatar : DEFAULT_AVATAR,
          streak: sameUser && prev?.streak ? prev.streak : { current: 0, longest: 0 },
          stars: sameUser && prev?.stars ? prev.stars : { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 },
        };
      });
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthUser(user);

      if (!user) {
        streakUpdatedForUid.current.clear();
        setProfile(null);
        setLoading(false);
        return;
      }

      if (!streakUpdatedForUid.current.has(user.uid)) {
        streakUpdatedForUid.current.add(user.uid);
        try {
          await updateLoginStreakForCurrentUser();
        } catch (error) {
          console.warn("Streak update failed", error);
        }
      }

      try {
        await ensureStarsDocument();
      } catch (error) {
        console.warn("Stars init failed", error);
      }

      try {
        await loadProfile(user);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, [loadProfile]);

  // Real-time profile sync for fields that can change while app is open (stars, streak, avatar, etc.)
  useEffect(() => {
    if (!authUser) return;

    const userRef = doc(db, "users", authUser.uid);
    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = (snap.data() as Record<string, unknown> | undefined) ?? undefined;
        const nextStreak = streakFromDoc(data);
        const nextStars = starsFromDoc(data);
        const nextAvatar =
          typeof data?.avatar === "string" && data.avatar.trim() !== ""
            ? data.avatar.trim()
            : undefined;
        const nextUsername =
          typeof data?.username === "string" && data.username.trim() !== ""
            ? data.username.trim()
            : undefined;
        const nextEmail =
          typeof data?.email === "string" && data.email.trim() !== ""
            ? data.email.trim()
            : undefined;

        setProfile((prev) => {
          if (!prev || prev.uid !== authUser.uid) {
            return {
              uid: authUser.uid,
              username: nextUsername ?? authUser.displayName?.trim() ?? "User",
              email: authUser.email ?? nextEmail ?? "",
              avatar: nextAvatar ?? DEFAULT_AVATAR,
              streak: nextStreak,
              stars: nextStars,
            };
          }

          return {
            ...prev,
            username: nextUsername ?? prev.username,
            email: authUser.email ?? nextEmail ?? prev.email,
            avatar: nextAvatar ?? prev.avatar,
            streak: nextStreak ?? prev.streak,
            stars: nextStars,
          };
        });
      },
      (error) => {
        console.warn("User profile realtime sync failed", error);
      }
    );

    return unsub;
  }, [authUser]);

  const refreshProfile = useCallback(async () => {
    setLoading(true);
    try {
      await loadProfile(auth.currentUser);
    } finally {
      setLoading(false);
    }
  }, [loadProfile]);

  const setProfileAvatar = async (avatar: string) => {
    if (!authUser) return;

    setProfile((current) => {
      if (!current) return current;
      return { ...current, avatar };
    });

    try {
      await updateUserAvatar(authUser.uid, avatar);
    } catch (error) {
      console.warn("Avatar update failed", error);
    }
  };

  const value = useMemo(
    () => ({ authUser, profile, loading, setProfileAvatar, refreshProfile }),
    [authUser, profile, loading, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthContext);
}
