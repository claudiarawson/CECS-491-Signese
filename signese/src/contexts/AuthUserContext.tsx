import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/src/services/firebase/firebase.config";
import {
  getUserProfile,
  updateUserAvatar,
  syncFirestoreUserEmailIfNeeded,
} from "@/src/services/firebase/auth.services";

type Profile = { uid: string; username: string; email: string; avatar: string } | null;

type AuthContextType = {
  authUser: User | null;
  profile: Profile;
  loading: boolean;
  setProfileAvatar: (avatar: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const DEFAULT_AVATAR = "🐨";

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
      // reload() can fail transiently after password/email updates; keep session and continue
      console.warn("user.reload() skipped or failed", reloadErr);
      freshUser = auth.currentUser ?? user;
    }

    try {
      const data = await getUserProfile(freshUser.uid);
      const fallbackUsername = freshUser.displayName?.trim() || "User";
      const firestoreEmail =
        typeof data?.email === "string" && data.email.trim() !== "" ? data.email.trim() : null;

      await syncFirestoreUserEmailIfNeeded(freshUser.uid, freshUser.email, firestoreEmail);

      setProfile((prev) => {
        const sameUser = prev?.uid === freshUser.uid;
        const fromDoc = data?.avatar as string | undefined;
        return {
          uid: freshUser.uid,
          username: (data?.username as string | undefined)?.trim() || fallbackUsername,
          // Prefer Auth email (updates after verify-before-email link); Firestore is synced in syncFirestoreUserEmailIfNeeded
          email: freshUser.email ?? firestoreEmail ?? (sameUser ? prev?.email ?? "" : ""),
          avatar:
            (fromDoc && fromDoc.trim() !== "" ? fromDoc : undefined) ??
            (sameUser ? prev?.avatar : undefined) ??
            DEFAULT_AVATAR,
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
        };
      });
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthUser(user);

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