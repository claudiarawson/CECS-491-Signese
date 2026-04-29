import { LessonDefinition } from "./types";

export const numbersLesson: LessonDefinition = {
  type: "numbers",
  title: "Numbers 1-10",
  subtitle: "Learn counting signs",
  // Group 1: 1-5
  signs: [
    { id: "number_1", label: "1", acceptedAnswers: ["1", "one"], gif: require("../../../data/asl/Number 1.gif"), lessonType: "numbers", order: 1, prompt: "What number is this sign?", distractors: ["2", "3", "4"] },
    { id: "number_2", label: "2", acceptedAnswers: ["2", "two"], gif: require("../../../data/asl/number02.jpg"), lessonType: "numbers", order: 2, prompt: "What number is this sign?", distractors: ["1", "3", "4"] },
    { id: "number_3", label: "3", acceptedAnswers: ["3", "three"], gif: require("../../../data/asl/number03.jpg"), lessonType: "numbers", order: 3, prompt: "What number is this sign?", distractors: ["2", "4", "5"] },
    { id: "number_4", label: "4", acceptedAnswers: ["4", "four"], gif: require("../../../data/asl/number04.jpg"), lessonType: "numbers", order: 4, prompt: "What number is this sign?", distractors: ["3", "5", "6"] },
    { id: "number_5", label: "5", acceptedAnswers: ["5", "five"], gif: require("../../../data/asl/number05.jpg"), lessonType: "numbers", order: 5, prompt: "What number is this sign?", distractors: ["4", "6", "7"] },
    // Group 2: 6-10
    { id: "number_6", label: "6", acceptedAnswers: ["6", "six"], gif: require("../../../data/asl/number06.jpg"), lessonType: "numbers", order: 6, prompt: "What number is this sign?", distractors: ["5", "7", "8"] },
    { id: "number_7", label: "7", acceptedAnswers: ["7", "seven"], gif: require("../../../data/asl/number07.jpg"), lessonType: "numbers", order: 7, prompt: "What number is this sign?", distractors: ["6", "8", "9"] },
    { id: "number_8", label: "8", acceptedAnswers: ["8", "eight"], gif: require("../../../data/asl/number08.jpg"), lessonType: "numbers", order: 8, prompt: "What number is this sign?", distractors: ["7", "9", "10"] },
    { id: "number_9", label: "9", acceptedAnswers: ["9", "nine"], gif: require("../../../data/asl/number09.jpg"), lessonType: "numbers", order: 9, prompt: "What number is this sign?", distractors: ["8", "10", "1"] },
    { id: "number_10", label: "10", acceptedAnswers: ["10", "ten"], gif: require("../../../data/asl/10.gif"), lessonType: "numbers", order: 10, prompt: "What number is this sign?", distractors: ["8", "9", "1"] },
  ],
};
