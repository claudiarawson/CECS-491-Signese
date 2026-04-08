import { LessonDefinition } from "./types";

export const greetingsLesson: LessonDefinition = {
  type: "greetings",
  title: "Greetings",
  subtitle: "Learn friendly everyday signs",
  signs: [
    {
      id: "nice_to_meet_you",
      label: "Nice to meet you",
      acceptedAnswers: ["nice to meet you", "nice meeting you"],
      gif: require("../../../assets/asl/greetings/nice_to_meet_you/nice_to_meet_you.gif"),
      lessonType: "greetings",
      order: 1,
      prompt: "What does this sign mean?",
      distractors: ["Good morning", "Hello", "How are you"],
      altLabels: ["Nice meeting you"],
    },
  ],
};
