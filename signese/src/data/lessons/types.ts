import { ImageSourcePropType } from "react-native";

export type LessonType = "alphabet" | "numbers" | "greetings";

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
