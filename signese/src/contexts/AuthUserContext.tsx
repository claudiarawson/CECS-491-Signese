import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/src/services/firebase/firebase.config";
import {
  getUserProfile,
  updateUserAvatar,
  syncFirestoreUserEmailIfNeeded,
} from "@/src/services/firebase/auth.services";
import { updateLoginStreakForCurrentUser } from "@/src/services/streak.service";

type ProfileStreak = {
  current: number;
  longest: number;
  lastLoginDate?: string;
};

type Profile = {
  uid: string;
  username: string;
  email: string;
  avatar: string;
  streak: ProfileStreak;
} | null;

type AuthContextType = {
  authUser: User | null;
  profile: Profile;
  loading: boolean;
  setProfileAvatar: (avatar: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEFAULT_AVATAR = "🐨";

function streakFromDoc(data: Record<string, unknown> | null | undefined): ProfileStreak {
  const s = data?.streak as Record<string, unknown> | undefined;
  return {
    current: typeof s?.current === "number" ? s.current : 0,
    longest: typeof s?.longest === "number" ? s.longest : 0,
    lastLoginDate: typeof s?.lastLoginDate === "string" ? s.lastLoginDate : undefined,
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
        await loadProfile(user);
      } finally {
        setLoading(false);
      }
    });

    return unsub;
  }, [loadProfile]);

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
