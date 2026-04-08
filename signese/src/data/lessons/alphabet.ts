import { LessonDefinition } from "./types";

export const alphabetLesson: LessonDefinition = {
  type: "alphabet",
  title: "Alphabet A-Z",
  subtitle: "Learn letter signs",
  signs: [
    {
      id: "letter_a",
      label: "A",
      acceptedAnswers: ["a", "letter a"],
      lessonType: "alphabet",
      order: 1,
      prompt: "Which letter is this sign?",
      distractors: ["B", "C", "D"],
    },
  ],
};
