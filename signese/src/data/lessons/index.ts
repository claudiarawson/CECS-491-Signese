import { alphabetLesson } from "./alphabet";
import { greetingsLesson } from "./greetings";
import { numbersLesson } from "./numbers";
import { LessonDefinition, LessonType } from "./types";

export const LESSON_MENU_ORDER: LessonType[] = ["alphabet", "numbers", "greetings"];

// Add grouped lesson entries for numbers and alphabet
export const LESSONS_BY_TYPE: Record<string, LessonDefinition> = {
  alphabet: alphabetLesson,
  numbers: numbersLesson,
  greetings: greetingsLesson,
  // Numbers groups
  "numbers-1-5": {
    ...numbersLesson,
    type: "numbers-1-5",
    title: "Numbers 1-5",
    signs: numbersLesson.signs.filter(s => s.order >= 1 && s.order <= 5),
  },
  "numbers-6-10": {
    ...numbersLesson,
    type: "numbers-6-10",
    title: "Numbers 6-10",
    signs: numbersLesson.signs.filter(s => s.order >= 6 && s.order <= 10),
  },
  // Alphabet groups
  "alphabet-a-d": {
    ...alphabetLesson,
    type: "alphabet-a-d",
    title: "Alphabet A-D",
    signs: alphabetLesson.signs.filter(s => ["A","B","C","D"].includes(s.label)),
  },
  "alphabet-e-h": {
    ...alphabetLesson,
    type: "alphabet-e-h",
    title: "Alphabet E-H",
    signs: alphabetLesson.signs.filter(s => ["E","F","G","H"].includes(s.label)),
  },
  "alphabet-i-m": {
    ...alphabetLesson,
    type: "alphabet-i-m",
    title: "Alphabet I-M",
    signs: alphabetLesson.signs.filter(s => ["I","J","K","L","M"].includes(s.label)),
  },
  "alphabet-n-r": {
    ...alphabetLesson,
    type: "alphabet-n-r",
    title: "Alphabet N-R",
    signs: alphabetLesson.signs.filter(s => ["N","O","P","Q","R"].includes(s.label)),
  },
  "alphabet-s-v": {
    ...alphabetLesson,
    type: "alphabet-s-v",
    title: "Alphabet S-V",
    signs: alphabetLesson.signs.filter(s => ["S","T","U","V"].includes(s.label)),
  },
  "alphabet-w-z": {
    ...alphabetLesson,
    type: "alphabet-w-z",
    title: "Alphabet W-Z",
    signs: alphabetLesson.signs.filter(s => ["W","X","Y","Z"].includes(s.label)),
  },
};

export const LESSON_DEFINITIONS: LessonDefinition[] = LESSON_MENU_ORDER.map(
  (type) => LESSONS_BY_TYPE[type]
);

export * from "./types";
