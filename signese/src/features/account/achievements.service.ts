import { auth, db } from "@/src/services/firebase/firebase.config";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

export type BadgeId =
  | "lessons_1"
  | "lessons_3"
  | "lessons_6"
  | "lessons_9"
  | "stars_1"
  | "stars_10"
  | "stars_67"
  | "streak_3"
  | "streak_7"
  | "streak_30";

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
};

export type AchievementSummary = {
  metrics: {
    lessonsCompleted: number;
    starsEarned: number;
    currentStreak: number;
  };
  earnedBadgeIds: BadgeId[];
  badges: BadgeDefinition[];
};

type UserDocShape = {
  stars?: {
    lifetimeEarned?: number;
  };
  streak?: {
    current?: number;
  };
  learningProgress?: {
    completedLessons?: string[];
  };
  achievements?: {
    badges?: Record<string, { earnedAt?: string }>;
  };
};

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "lessons_1",
    title: "First Lesson",
    description: "Complete your first lesson.",
    icon: "📘",
  },
  {
    id: "lessons_3",
    title: "Learning Momentum",
    description: "Complete 3 lessons.",
    icon: "🚀",
  },
  {
    id: "stars_1",
    title: "First Star",
    description: "Earn your first star.",
    icon: "✨",
  },
  {
    id: "stars_10",
    title: "Star Collector",
    description: "Earn 10 stars total.",
    icon: "⭐",
  },
  {
    id: "stars_67",
    title: "Star Master",
    description: "Earn 67 stars total.",
    icon: "🌟",
  },
  {
    id: "streak_3",
    title: "On Fire",
    description: "Reach a 3-day login streak.",
    icon: "🔥",
  },
  {
    id: "streak_7",
    title: "Weekly Warrior",
    description: "Reach a 7-day login streak.",
    icon: "📆",
  },
  {
    id: "streak_30",
    title: "Monthly Legend",
    description: "Reach a 30-day login streak.",
    icon: "🏆",
  },
  {
    id: "lessons_6",
    title: "Deep Learner",
    description: "Complete 6 lessons.",
    icon: "🎯",
  },
  {
    id: "lessons_9",
    title: "Lesson Champion",
    description: "Complete 9 lessons.",
    icon: "👑",
  },
];

function evaluateEarnedBadgeIds(metrics: AchievementSummary["metrics"]): BadgeId[] {
  const earned: BadgeId[] = [];

  if (metrics.lessonsCompleted >= 1) earned.push("lessons_1");
  if (metrics.lessonsCompleted >= 3) earned.push("lessons_3");
  if (metrics.lessonsCompleted >= 6) earned.push("lessons_6");
  if (metrics.lessonsCompleted >= 9) earned.push("lessons_9");
  if (metrics.starsEarned >= 1) earned.push("stars_1");
  if (metrics.starsEarned >= 10) earned.push("stars_10");
  if (metrics.starsEarned >= 67) earned.push("stars_67");
  if (metrics.currentStreak >= 3) earned.push("streak_3");
  if (metrics.currentStreak >= 7) earned.push("streak_7");
  if (metrics.currentStreak >= 30) earned.push("streak_30");

  return earned;
}

export async function syncAndGetCurrentUserAchievements(): Promise<AchievementSummary> {
  const user = auth.currentUser;
  if (!user) {
    return {
      metrics: {
        lessonsCompleted: 0,
        starsEarned: 0,
        currentStreak: 0,
      },
      earnedBadgeIds: [],
      badges: BADGE_DEFINITIONS,
    };
  }

  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);
  const data = (snap.data() as UserDocShape | undefined) ?? {};

  const completedLessons = Array.isArray(data.learningProgress?.completedLessons)
    ? data.learningProgress?.completedLessons
    : [];

  const metrics: AchievementSummary["metrics"] = {
    lessonsCompleted: completedLessons.length,
    starsEarned: typeof data.stars?.lifetimeEarned === "number" ? data.stars.lifetimeEarned : 0,
    currentStreak: typeof data.streak?.current === "number" ? data.streak.current : 0,
  };

  const newlyEarned = evaluateEarnedBadgeIds(metrics);
  const existingBadges = data.achievements?.badges ?? {};

  const mergedBadges: Record<string, { earnedAt: string }> = { ...existingBadges } as Record<
    string,
    { earnedAt: string }
  >;
  const now = new Date().toISOString();

  for (const id of newlyEarned) {
    if (!mergedBadges[id]) {
      mergedBadges[id] = { earnedAt: now };
    }
  }

  await setDoc(
    userRef,
    {
      learningProgress: {
        completedLessons,
      },
      achievements: {
        badges: mergedBadges,
        updatedAt: serverTimestamp(),
      },
    },
    { merge: true }
  );

  const earnedBadgeIds = BADGE_DEFINITIONS.map((b) => b.id).filter((id) => Boolean(mergedBadges[id])) as BadgeId[];

  return {
    metrics,
    earnedBadgeIds,
    badges: BADGE_DEFINITIONS,
  };
}

