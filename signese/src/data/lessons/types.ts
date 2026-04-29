import { ImageSourcePropType } from "react-native";

export type LessonType =
  | "alphabet"
  | "numbers"
  | "greetings"
  | "numbers-1-5"
  | "numbers-6-10"
  | "alphabet-a-d"
  | "alphabet-e-h"
  | "alphabet-i-m"
  | "alphabet-n-r"
  | "alphabet-s-v"
  | "alphabet-w-z";

export type LessonSign = {
  id: string;
  label: string;
  acceptedAnswers: string[];
  gif?: ImageSourcePropType;
  lessonType: LessonType;
  order: number;
  prompt?: string;
  distractors?: string[];
  altLabels?: string[];
};

export type LessonDefinition = {
  type: LessonType;
  title: string;
  subtitle: string;
  signs: LessonSign[];
};
