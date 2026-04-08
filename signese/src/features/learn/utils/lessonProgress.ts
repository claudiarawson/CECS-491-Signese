import AsyncStorage from "@react-native-async-storage/async-storage";

const TOTAL_STARS_KEY = "totalStars";
const UNLOCKED_LESSONS_KEY = "unlockedLessons";
const COMPLETED_LESSONS_KEY = "completedLessons";

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

export async function getTotalStars() {
  const value = await AsyncStorage.getItem(TOTAL_STARS_KEY);
  return value ? Number(value) : 0;
}

export async function setTotalStars(stars: number) {
  await AsyncStorage.setItem(TOTAL_STARS_KEY, String(stars));
}

export async function getUnlockedLessons(): Promise<LessonId[]> {
  const value = await AsyncStorage.getItem(UNLOCKED_LESSONS_KEY);

  if (!value) {
    await AsyncStorage.setItem(
      UNLOCKED_LESSONS_KEY,
      JSON.stringify(DEFAULT_UNLOCKED)
    );
    return DEFAULT_UNLOCKED;
  }

  const parsed = JSON.parse(value) as LessonId[];

  if (!parsed.includes("alphabet")) {
    const fixed = ["alphabet", ...parsed.filter((id) => id !== "alphabet")] as LessonId[];
    await AsyncStorage.setItem(UNLOCKED_LESSONS_KEY, JSON.stringify(fixed));
    return fixed;
  }

  return parsed;
}

export async function setUnlockedLessons(lessons: LessonId[]) {
  await AsyncStorage.setItem(UNLOCKED_LESSONS_KEY, JSON.stringify(lessons));
}

export async function getCompletedLessons(): Promise<LessonId[]> {
  const value = await AsyncStorage.getItem(COMPLETED_LESSONS_KEY);

  if (!value) {
    await AsyncStorage.setItem(
      COMPLETED_LESSONS_KEY,
      JSON.stringify(DEFAULT_COMPLETED)
    );
    return DEFAULT_COMPLETED;
  }

  return JSON.parse(value) as LessonId[];
}

export async function setCompletedLessons(lessons: LessonId[]) {
  await AsyncStorage.setItem(COMPLETED_LESSONS_KEY, JSON.stringify(lessons));
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

export async function completeLessonOnce(
  lessonId: LessonId,
  starsEarned: number
) {
  const completed = await getCompletedLessons();
  const alreadyCompleted = completed.includes(lessonId);

  let totalStars = await getTotalStars();
  let unlockedNextLessonId: LessonId | null = null;

  if (!alreadyCompleted) {
    totalStars += starsEarned;
    await setTotalStars(totalStars);

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