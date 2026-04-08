import { readLocalJson, writeLocalJson } from "@/src/storage/localJsonFile";
import { auth } from "@/src/services/firebase/firebase.config";
import {
  addStarsToCurrentUser,
  ensureStarsDocument,
  getCurrentUserStars,
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
};

const DEFAULT_PERSISTED: Persisted = {
  totalStars: 0,
  unlockedLessons: [...DEFAULT_UNLOCKED],
  completedLessons: [...DEFAULT_COMPLETED],
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
  });
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
