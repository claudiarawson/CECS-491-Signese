import { LessonDefinition } from "./types";

export const numbersLesson: LessonDefinition = {
  type: "numbers",
  title: "Numbers 0-9",
  subtitle: "Learn counting signs",
  signs: [
    {
      id: "number_0",
      label: "Zero",
      acceptedAnswers: ["zero", "0"],
      lessonType: "numbers",
      order: 1,
      prompt: "What number is this sign?",
      distractors: ["One", "Two", "Three"],
    },
  ],
};
