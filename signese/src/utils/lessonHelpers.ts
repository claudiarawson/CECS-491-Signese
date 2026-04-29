import { LESSONS_BY_TYPE, LessonSign } from "@/src/data/lessons";
import { validateTypedAnswer } from "./answerValidation";

export function getLessonSigns(lessonType: string): LessonSign[] {
  const lesson = LESSONS_BY_TYPE[lessonType];
  if (!lesson) return [];
  return lesson.signs.slice().sort((a, b) => a.order - b.order);
}

export function getSignByOrder(
  lessonType: string,
  order: number
): LessonSign | undefined {
  return getLessonSigns(lessonType).find((sign) => sign.order === order);
}

export function getNextSign(lessonType: string, currentOrder: number): LessonSign | undefined {
  return getSignByOrder(lessonType, currentOrder + 1);
}

export function buildQuizOptions(currentSign: LessonSign, lessonSigns: LessonSign[]): string[] {
  const options = new Set<string>();
  options.add(currentSign.label);

  const explicitDistractors = currentSign.distractors ?? [];
  explicitDistractors.forEach((item) => options.add(item));

  for (const sign of lessonSigns) {
    if (options.size >= 4) {
      break;
    }
    if (sign.id !== currentSign.id) {
      options.add(sign.label);
    }
  }

  const optionArray = Array.from(options).slice(0, 4);
  return shuffleStrings(optionArray);
}

function shuffleStrings(items: string[]): string[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function calculateProgress(
  lessonType: string,
  signOrder: number,
  phase: "learn" | "quiz" | "type" | "match"
): { currentStep: number; totalSteps: number } {
  const signCount = getLessonSigns(lessonType).length;
  const totalSteps = signCount * 3 + 1;

  if (phase === "match") {
    return { currentStep: totalSteps, totalSteps };
  }

  const base = (signOrder - 1) * 3;
  const phaseOffset = phase === "learn" ? 1 : phase === "quiz" ? 2 : 3;

  return {
    currentStep: Math.min(totalSteps, base + phaseOffset),
    totalSteps,
  };
}

export function calculateLessonStars(completed: boolean, usedBonus: boolean): number {
  if (!completed) {
    return 0;
  }
  return usedBonus ? 5 : 4;
}

export function isTypedAnswerCorrect(input: string, acceptedAnswers: string[]): boolean {
  return validateTypedAnswer(input, acceptedAnswers);
}
