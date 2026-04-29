import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  QuizAnswerButton,
  SignLessonCard,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { lessonColors, lessonSpacing, lessonTypography } from "@/src/theme";
import {
  buildQuizOptions,
  calculateProgress,
  getLessonSigns,
  getSignByOrder,
} from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function QuizSignScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; order?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const order = Number(params.order ?? "1");
  const score = Number(params.score ?? "0");

  const sign = getSignByOrder(lessonId, order);
  const lessonSigns = getLessonSigns(lessonId);
  const progress = calculateProgress(lessonId, order, "quiz");

  const options = useMemo(() => {
    if (!sign) {
      return [];
    }
    return buildQuizOptions(sign, lessonSigns);
  }, [lessonSigns, sign]);

  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (!sign) {
    return (
      <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
        <ScreenHeader title="Quiz" showBackButton />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not find this sign.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const isCorrect = selected === sign.label;

  const handleContinue = () => {
    if (!selected) {
      return;
    }

    if (!submitted) {
      setSubmitted(true);
      return;
    }

    const updatedScore = score + (isCorrect ? 1 : 0);
    router.push({
      pathname: "/learn/type-answer",
      params: {
        lessonId,
        order: String(order),
        score: String(updatedScore),
      },
    } as any);
  };

  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title={lessonId === "numbers" ? "Quiz Numbers" : "Quiz"} showBackButton />
      <View style={styles.content}>
        <LessonHeader title={lessonId === "numbers" ? "Choose the correct number" : "Choose the correct meaning"} />
        <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />
        <SignLessonCard gif={sign.gif} instruction={sign.prompt ?? "What does this sign mean?"} />

        <View style={styles.grid}>
          {options.map((option) => {
            let state: "default" | "selected" | "correct" | "incorrect" = "default";
            if (selected === option && !submitted) {
              state = "selected";
            }
            if (submitted && option === sign.label) {
              state = "correct";
            }
            if (submitted && selected === option && option !== sign.label) {
              state = "incorrect";
            }

            return (
              <QuizAnswerButton
                key={option}
                label={option}
                state={state}
                onPress={() => !submitted && setSelected(option)}
                disabled={submitted}
              />
            );
          })}
        </View>

        {submitted ? (
          <Text style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>
            {isCorrect ? "Correct" : `Not quite. Correct answer: ${sign.label}`}
          </Text>
        ) : null}

        <View style={styles.footer}>
          <PrimaryActionButton
            label={submitted ? "Continue" : "Check"}
            onPress={handleContinue}
            disabled={!selected}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  grid: {
    marginTop: lessonSpacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: lessonSpacing.sm,
  },
  feedback: {
    ...lessonTypography.body,
    textAlign: "center",
    marginTop: lessonSpacing.md,
  },
  correct: {
    color: lessonColors.success,
  },
  incorrect: {
    color: lessonColors.error,
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: lessonSpacing.lg,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    ...lessonTypography.body,
    color: lessonColors.textSecondary,
  },
});
