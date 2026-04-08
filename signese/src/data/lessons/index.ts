import { alphabetLesson } from "./alphabet";
import { greetingsLesson } from "./greetings";
import { numbersLesson } from "./numbers";
import { LessonDefinition, LessonType } from "./types";

export const LESSON_MENU_ORDER: LessonType[] = ["alphabet", "numbers", "greetings"];

export const LESSONS_BY_TYPE: Record<LessonType, LessonDefinition> = {
  alphabet: alphabetLesson,
  numbers: numbersLesson,
  greetings: greetingsLesson,
};

export const LESSON_DEFINITIONS: LessonDefinition[] = LESSON_MENU_ORDER.map(
  (type) => LESSONS_BY_TYPE[type]
);

export * from "./types";
