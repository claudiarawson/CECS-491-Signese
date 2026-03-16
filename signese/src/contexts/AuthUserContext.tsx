// This folder "contexts" is a central place for golbal share state across the app.
// This file in particular is for storing the current authenticated user and their profile data.
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/src/services/firebase/firebase.config";
import { getUserProfile } from "@/src/services/firebase/auth.services";

type Profile = { uid: string; username: string; email: string } | null;
type AuthContextType = { authUser: User | null; profile: Profile; loading: boolean };

const AuthContext = createContext<AuthContextType>({ authUser: null, profile: null, loading: true });

export function AuthUserProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (user) {
        const data = await getUserProfile(user.uid);
        const fallbackUsername = user.displayName ?? "User";
        setProfile({
          uid: user.uid,
          username: (data?.username as string | undefined) ?? fallbackUsername,
          email: data?.email ?? user.email ?? "",
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo(() => ({ authUser, profile, loading }), [authUser, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthUser() {
  return useContext(AuthContext);
}