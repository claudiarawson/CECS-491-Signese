import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/src/services/firebase/firebase.config";
import {
  DEFAULT_PROFILE_ICON_ID,
  getProfileIconById,
  PROFILE_ICONS,
} from "./types";
import { spendStarsForCurrentUser } from "@/src/features/gamification/stars.services";

type UserDocProfileShape = {
  avatar?: string;
  profileIcons?: {
    selectedIcon?: string;
    unlockedIconIds?: string[];
  };
};

export async function getCurrentUserProfileIcons() {
  const user = auth.currentUser;
  if (!user) {
    return {
      selectedIcon: DEFAULT_PROFILE_ICON_ID,
      unlockedIconIds: [DEFAULT_PROFILE_ICON_ID],
    };
  }

  const snap = await getDoc(doc(db, "users", user.uid));
  const data = snap.data() as UserDocProfileShape | undefined;

  const unlocked = Array.isArray(data?.profileIcons?.unlockedIconIds)
    ? data.profileIcons.unlockedIconIds.filter((id) =>
        PROFILE_ICONS.some((icon) => icon.id === id)
      )
    : [];

  const unlockedIconIds = unlocked.includes(DEFAULT_PROFILE_ICON_ID)
    ? unlocked
    : [DEFAULT_PROFILE_ICON_ID, ...unlocked];

  const selectedCandidate =
    data?.profileIcons?.selectedIcon ?? data?.avatar ?? DEFAULT_PROFILE_ICON_ID;

  const selectedIcon = unlockedIconIds.includes(selectedCandidate)
    ? selectedCandidate
    : DEFAULT_PROFILE_ICON_ID;

  return {
    selectedIcon,
    unlockedIconIds,
  };
}

export async function selectCurrentUserProfileIcon(iconId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const current = await getCurrentUserProfileIcons();
  if (!current.unlockedIconIds.includes(iconId)) {
    throw new Error("This icon is still locked.");
  }

  const icon = getProfileIconById(iconId);

  await setDoc(
    doc(db, "users", user.uid),
    {
      avatar: iconId,
      profileIcons: {
        selectedIcon: iconId,
        unlockedIconIds: current.unlockedIconIds,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return icon;
}

export async function unlockCurrentUserProfileIcon(iconId: string) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const icon = getProfileIconById(iconId);
  const current = await getCurrentUserProfileIcons();

  if (current.unlockedIconIds.includes(iconId)) {
    return current;
  }

  if (icon.starsRequired <= 0) {
    const nextUnlocked = [...new Set([...current.unlockedIconIds, iconId])];

    await setDoc(
      doc(db, "users", user.uid),
      {
        avatar: current.selectedIcon,
        profileIcons: {
          selectedIcon: current.selectedIcon,
          unlockedIconIds: nextUnlocked,
        },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      selectedIcon: current.selectedIcon,
      unlockedIconIds: nextUnlocked,
    };
  }

  await spendStarsForCurrentUser(icon.starsRequired);

  const nextUnlocked = [...new Set([...current.unlockedIconIds, iconId])];

  await setDoc(
    doc(db, "users", user.uid),
    {
      profileIcons: {
        selectedIcon: current.selectedIcon,
        unlockedIconIds: nextUnlocked,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return {
    selectedIcon: current.selectedIcon,
    unlockedIconIds: nextUnlocked,
  };
}