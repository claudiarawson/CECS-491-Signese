import React, { useState, useMemo } from "react";
import { View, Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { lessonColors } from "@/src/theme";
import {
  LessonHeader,
  LessonProgressBar,
  SignLessonCard,
  PrimaryActionButton,
  TypingAnswerInput,
} from "@/src/components/lesson-index";
import {
  getSignByOrder,
  getNextSign,
  calculateProgress,
} from "../../utils/lessonHelpers";
import { validateTypedAnswer } from "../../utils/answerValidation";
import { LessonType } from "@/src/data/lessons";

export function TypeAnswerScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; order?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "alphabet") as LessonType;
  const order = Number(params.order ?? "1");
  const score = Number(params.score ?? "0");

  const handleBackToLearn = () => router.replace("/learn");
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
        <ScreenHeader title={lessonId === "numbers" ? "Type Number" : "Type Answer"} showBackButton onBackPress={handleBackToLearn} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#888", fontSize: 16 }}>Could not find this sign.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleSubmitOrContinue = () => {
    if (!submitted) {
      const correct = validateTypedAnswer(value, sign.acceptedAnswers);
      setIsCorrect(correct);
      setSubmitted(true);
      return;
    }
    const updatedScore = score + (isCorrect ? 1 : 0);
    if (nextSign) {
      router.replace({
        pathname: "/learn/type-answer",
        params: {
          lessonId,
          order: String(order + 1),
          score: String(updatedScore),
        },
      } as any);
    } else {
      router.replace({
        pathname: "/learn/lesson-complete",
        params: { lessonId, score: String(updatedScore) },
      } as any);
    }
  };

  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title={lessonId === "numbers" ? "Type Number" : "Type Answer"} showBackButton onBackPress={handleBackToLearn} />
      <View style={{ flex: 1 }}>
        <LessonHeader title={sign.label} subtitle={lessonId === "numbers" ? "Type the number you see" : "Type the meaning"} />
        <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />
        <SignLessonCard gif={sign.gif} instruction={lessonId === "numbers" ? "Type what this number is." : "Type what this sign means."} />
        <View style={{ marginVertical: 16 }}>
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
          <Text style={{ textAlign: "center", color: isCorrect ? "green" : "red", fontSize: 16, marginBottom: 8 }}>{feedback}</Text>
        ) : null}
        <View style={{ marginTop: 16 }}>
          <PrimaryActionButton
            label={submitted ? (nextSign ? "Continue" : "Finish") : "Submit"}
            onPress={handleSubmitOrContinue}
            disabled={!value && !submitted}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
