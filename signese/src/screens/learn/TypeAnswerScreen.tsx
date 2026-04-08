import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  SignLessonCard,
  TypingAnswerInput,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { lessonColors, lessonSpacing, lessonTypography } from "@/src/theme";
import {
  calculateProgress,
  getNextSign,
  getSignByOrder,
  isTypedAnswerCorrect,
} from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export function TypeAnswerScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; order?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const order = Number(params.order ?? "1");
  const score = Number(params.score ?? "0");

  const sign = getSignByOrder(lessonId, order);
  const nextSign = getNextSign(lessonId, order);
  const progress = calculateProgress(lessonId, order, "type");

  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const inputPlaceholder =
    lessonId === "alphabet"
      ? "Type a letter (A-Z)"
      : lessonId === "numbers"
      ? "Type a number (0-9)"
      : "Type your answer";

  const feedback = useMemo(() => {
    if (!submitted || !sign) {
      return "";
    }
    if (isCorrect) {
      return "Nice work";
    }
    return `Accepted answer: ${sign.acceptedAnswers[0]}`;
  }, [isCorrect, sign, submitted]);

  if (!sign) {
    return (
      <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
        <ScreenHeader title="Type Answer" showBackButton />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not find this sign.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSubmitOrContinue = () => {
    if (!submitted) {
      const correct = isTypedAnswerCorrect(value, sign.acceptedAnswers);
      setIsCorrect(correct);
      setSubmitted(true);
      return;
    }

    const updatedScore = score + (isCorrect ? 1 : 0);
    if (nextSign) {
      router.push({
        pathname: "/learn/[lessonId]",
        params: {
          lessonId,
          order: String(order + 1),
          score: String(updatedScore),
        },
      } as any);
      return;
    }

    router.push({
      pathname: "/learn/match-signs",
      params: {
        lessonId,
        score: String(updatedScore),
      },
    } as any);
  };

  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title="Type Answer" showBackButton />
      <View style={styles.content}>
        <LessonHeader title="Type the meaning" />
        <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />

        <SignLessonCard gif={sign.gif} instruction="Type what this sign means." />

        <View style={styles.inputWrap}>
          <TypingAnswerInput
            value={value}
            onChangeText={setValue}
            placeholder={inputPlaceholder}
            editable={!submitted}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {submitted ? (
          <Text style={[styles.feedback, isCorrect ? styles.correct : styles.incorrect]}>{feedback}</Text>
        ) : null}

        <View style={styles.footer}>
          <PrimaryActionButton
            label={submitted ? "Continue" : "Submit"}
            onPress={handleSubmitOrContinue}
            disabled={!submitted && value.trim().length === 0}
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
  inputWrap: {
    marginTop: lessonSpacing.md,
  },
  feedback: {
    ...lessonTypography.body,
    marginTop: lessonSpacing.md,
    textAlign: "center",
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
