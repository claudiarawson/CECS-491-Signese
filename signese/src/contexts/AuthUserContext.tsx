// This folder "contexts" is a central place for golbal share state across the app.
// This file in particular is for storing the current authenticated user and their profile data.
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/src/services/firebase/firebase.config";
import { getUserProfile, updateUserAvatar } from "@/src/services/firebase/auth.services";
import { updateLoginStreakForCurrentUser } from "@/src/services/streak.service";

type ProfileStreak = {
  current: number;
  longest: number;
  lastLoginDate?: string;
} | null;
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
};

const DEFAULT_AVATAR = "🐨";

const AuthContext = createContext<AuthContextType>({
  authUser: null,
  profile: null,
  loading: true,
  setProfileAvatar: async () => {},
});

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);
  const streakUpdatedForUid = useRef<Set<string>>(new Set());

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        if (!streakUpdatedForUid.current.has(user.uid)) {
          streakUpdatedForUid.current.add(user.uid);
          try {
            await updateLoginStreakForCurrentUser();
          } catch (error) {
            console.warn("Streak update failed", error);
          }
        }

        const data = await getUserProfile(user.uid);
        const fallbackUsername = user.displayName ?? "User";
        setProfile({
          uid: user.uid,
          username: (data?.username as string | undefined) ?? fallbackUsername,
          email: data?.email ?? user.email ?? "",
          avatar: (data?.avatar as string | undefined) ?? DEFAULT_AVATAR,
          streak: {
            current:
              typeof data?.streak?.current === "number" ? (data.streak.current as number) : 0,
            longest:
              typeof data?.streak?.longest === "number" ? (data.streak.longest as number) : 0,
            lastLoginDate:
              typeof data?.streak?.lastLoginDate === "string"
                ? (data.streak.lastLoginDate as string)
                : undefined,
          },
        });
      } else {
        streakUpdatedForUid.current.clear();
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setProfileAvatar = async (avatar: string) => {
    if (!authUser) {
      return;
    }

    setProfile((current) => {
      if (!current) {
        return current;
      }
      return { ...current, avatar };
    });

    try {
      await updateUserAvatar(authUser.uid, avatar);
    } catch (error) {
      console.warn("Avatar update failed", error);
    }
  };

  const value = useMemo(
    () => ({ authUser, profile, loading, setProfileAvatar }),
    [authUser, profile, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthContext);
}