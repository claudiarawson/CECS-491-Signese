import { readLocalJson, writeLocalJson } from "@/src/storage/localJsonFile";
import { auth } from "@/src/services/firebase/firebase.config";
import {
  addStarsToCurrentUser,
  ensureStarsDocument,
  getCurrentUserStars,
  spendStarsForCurrentUser,
} from "@/src/features/gamification/stars.services";

const FILE_NAME = "lesson_progress.json";
const WEB_KEY = "signese_lesson_progress_v1";

export type LessonId =
  | "alphabet"
  | "numbers"
  | "greetings"
  | "family"
  | "colors"
  | "telling-time"
  | "food-drink";

export const LESSON_STAR_REQUIREMENTS: Record<LessonId, number> = {
  alphabet: 0,
  numbers: 3,
  greetings: 6,
  family: 9,
  colors: 12,
  "telling-time": 15,
  "food-drink": 18,
};

export const LESSON_ORDER: LessonId[] = [
  "alphabet",
  "numbers",
  "greetings",
  "family",
  "colors",
  "telling-time",
  "food-drink",
];

const DEFAULT_UNLOCKED: LessonId[] = ["alphabet"];
const DEFAULT_COMPLETED: LessonId[] = [];

type Persisted = {
  totalStars: number;
  unlockedLessons: LessonId[];
  completedLessons: LessonId[];
  lessonStepProgress?: Partial<Record<LessonId, number>>;
};

const DEFAULT_PERSISTED: Persisted = {
  totalStars: 0,
  unlockedLessons: [...DEFAULT_UNLOCKED],
  completedLessons: [...DEFAULT_COMPLETED],
  lessonStepProgress: {},
};

async function loadPersisted(): Promise<Persisted> {
  const raw = await readLocalJson<Persisted>(FILE_NAME, WEB_KEY, DEFAULT_PERSISTED);

  let unlocked = Array.isArray(raw.unlockedLessons) ? raw.unlockedLessons : [...DEFAULT_UNLOCKED];
  if (!unlocked.includes("alphabet")) {
    unlocked = ["alphabet", ...unlocked.filter((id) => id !== "alphabet")] as LessonId[];
  }

  return {
    totalStars: typeof raw.totalStars === "number" ? raw.totalStars : 0,
    unlockedLessons: unlocked,
    completedLessons: Array.isArray(raw.completedLessons) ? raw.completedLessons : [...DEFAULT_COMPLETED],
    lessonStepProgress:
      typeof raw.lessonStepProgress === "object" && raw.lessonStepProgress != null
        ? raw.lessonStepProgress
        : {},
  };
}

async function savePersisted(data: Persisted): Promise<void> {
  await writeLocalJson(FILE_NAME, WEB_KEY, data);
}

export async function getTotalStars() {
  if (auth.currentUser) {
    try {
      await ensureStarsDocument();
      const stars = await getCurrentUserStars();
      return stars.balance;
    } catch (error) {
      console.warn("Failed to load backend stars, falling back to local stars", error);
    }
  }

  const p = await loadPersisted();
  return p.totalStars;
}

export async function setTotalStars(stars: number) {
  const p = await loadPersisted();
  p.totalStars = stars;
  await savePersisted(p);
}

export async function getUnlockedLessons(): Promise<LessonId[]> {
  const p = await loadPersisted();
  return p.unlockedLessons;
}

export async function setUnlockedLessons(lessons: LessonId[]) {
  const p = await loadPersisted();
  p.unlockedLessons = lessons;
  await savePersisted(p);
}

export async function getCompletedLessons(): Promise<LessonId[]> {
  const p = await loadPersisted();
  return p.completedLessons;
}

export async function setCompletedLessons(lessons: LessonId[]) {
  const p = await loadPersisted();
  p.completedLessons = lessons;
  await savePersisted(p);
}

/** Clears local lesson progress (stars + unlocks + completions). */
export async function resetLessonProgress(): Promise<void> {
  await savePersisted({
    totalStars: 0,
    unlockedLessons: [...DEFAULT_UNLOCKED],
    completedLessons: [...DEFAULT_COMPLETED],
    lessonStepProgress: {},
  });
}

const LESSON_STEP_TOTAL: Partial<Record<LessonId, number>> = {
  alphabet: 3,
};

/**
 * Record local screen-step progress for a lesson.
 * For alphabet: 1=learn, 2=type, 3=quiz/complete
 */
export async function setLessonStepProgress(lessonId: LessonId, completedSteps: number) {
  const p = await loadPersisted();
  const total = LESSON_STEP_TOTAL[lessonId];
  if (!total) return;

  const safeSteps = Math.max(0, Math.min(total, Math.floor(completedSteps)));
  const prev = p.lessonStepProgress?.[lessonId] ?? 0;
  const next = Math.max(prev, safeSteps);

  p.lessonStepProgress = {
    ...(p.lessonStepProgress ?? {}),
    [lessonId]: next,
  };
  await savePersisted(p);
}

export async function getLessonProgressPercent(lessonId: LessonId): Promise<number> {
  const total = LESSON_STEP_TOTAL[lessonId];
  if (!total) return 0;

  // Completed lesson always shows 100%
  if (await isLessonCompleted(lessonId)) return 100;

  const p = await loadPersisted();
  const steps = p.lessonStepProgress?.[lessonId] ?? 0;
  const percent = (Math.max(0, Math.min(total, steps)) / total) * 100;
  return Math.round(percent);
}

export async function getLessonStepProgress(lessonId: LessonId): Promise<number> {
  const total = LESSON_STEP_TOTAL[lessonId];
  if (!total) return 0;

  const p = await loadPersisted();
  const steps = p.lessonStepProgress?.[lessonId] ?? 0;
  return Math.max(0, Math.min(total, steps));
}

export async function isLessonUnlocked(lessonId: LessonId) {
  const unlocked = await getUnlockedLessons();
  return unlocked.includes(lessonId);
}

export async function isLessonCompleted(lessonId: LessonId) {
  const completed = await getCompletedLessons();
  return completed.includes(lessonId);
}

export function getNextLessonId(currentLessonId: LessonId): LessonId | null {
  const currentIndex = LESSON_ORDER.indexOf(currentLessonId);

  if (currentIndex === -1 || currentIndex === LESSON_ORDER.length - 1) {
    return null;
  }

  return LESSON_ORDER[currentIndex + 1];
}

export async function unlockNextLesson(currentLessonId: LessonId) {
  const nextLessonId = getNextLessonId(currentLessonId);

  if (!nextLessonId) {
    return null;
  }

  const unlocked = await getUnlockedLessons();

  if (unlocked.includes(nextLessonId)) {
    return nextLessonId;
  }

  const updatedUnlocked = [...unlocked, nextLessonId];
  await setUnlockedLessons(updatedUnlocked);

  return nextLessonId;
}

export async function unlockLessonWithStars(lessonId: LessonId) {
  const unlocked = await getUnlockedLessons();
  if (unlocked.includes(lessonId)) {
    return {
      lessonId,
      alreadyUnlocked: true,
      starsRemaining: await getTotalStars(),
    };
  }

  const cost = LESSON_STAR_REQUIREMENTS[lessonId];

  // First lesson should always be free and unlocked.
  if (lessonId === "alphabet" || cost <= 0) {
    const updatedUnlocked = [...new Set([...unlocked, lessonId])];
    await setUnlockedLessons(updatedUnlocked);
    return {
      lessonId,
      alreadyUnlocked: false,
      starsRemaining: await getTotalStars(),
    };
  }

  const totalStars = await getTotalStars();
  if (totalStars < cost) {
    throw new Error(
      `Not enough stars. ${lessonId} requires ${cost} stars, but you only have ${totalStars}.`
    );
  }

  let starsRemaining = totalStars;
  if (auth.currentUser) {
    await ensureStarsDocument();
    const updated = await spendStarsForCurrentUser(cost);
    starsRemaining = updated.balance;
    // Keep local fallback cache aligned with backend balance.
    await setTotalStars(starsRemaining);
  } else {
    starsRemaining = totalStars - cost;
    await setTotalStars(starsRemaining);
  }

  const updatedUnlocked = [...new Set([...unlocked, lessonId])];
  await setUnlockedLessons(updatedUnlocked);

  return {
    lessonId,
    alreadyUnlocked: false,
    starsRemaining,
  };
}

export async function completeLessonOnce(lessonId: LessonId, starsEarned: number) {
  const completed = await getCompletedLessons();
  const alreadyCompleted = completed.includes(lessonId);

  let totalStars = await getTotalStars();
  let unlockedNextLessonId: LessonId | null = null;

  if (!alreadyCompleted) {
    if (auth.currentUser) {
      await ensureStarsDocument();
      const updated = await addStarsToCurrentUser(starsEarned);
      totalStars = updated.balance;
      // Keep local value in sync for any offline/fallback code paths.
      await setTotalStars(totalStars);
    } else {
      totalStars += starsEarned;
      await setTotalStars(totalStars);
    }

    const updatedCompleted = [...completed, lessonId];
    await setCompletedLessons(updatedCompleted);

    unlockedNextLessonId = await unlockNextLesson(lessonId);
  } else {
    unlockedNextLessonId = getNextLessonId(lessonId);
  }

  return {
    totalStars,
    alreadyCompleted,
    unlockedNextLessonId,
  };
}
