import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  SignLessonCard,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { lessonColors, lessonSpacing, lessonTypography } from "@/src/theme";
import { calculateProgress, getSignByOrder } from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function LearnSignScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; order?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const order = Number(params.order ?? "1");
  const score = Number(params.score ?? "0");

  const sign = getSignByOrder(lessonId, order);
  const progress = calculateProgress(lessonId, order, "learn");

  if (!sign) {
    return (
      <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
        <ScreenHeader title="Learn" showBackButton />
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>This lesson does not have signs yet.</Text>
        </View>
      </ScreenContainer>
    );
  }

  const handleNext = () => {
    // For numbers, alphabet, greetings: always go to quiz next
    router.push({
      pathname: "/learn/quiz-sign",
      params: {
        lessonId,
        order: String(order),
        score: String(score),
      },
    } as any);
  };

  // Consistent UI for all lessons
  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title={lessonId === "numbers" ? "Learn Numbers" : "Learn"} showBackButton />
      <View style={styles.content}>
        <LessonHeader
          title={sign.label}
          subtitle={lessonId === "numbers" ? "Watch the sign and remember the meaning." : "Watch and learn this sign"}
        />
        <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />
        <SignLessonCard
          gif={sign.gif}
          label={sign.label}
          instruction={lessonId === "numbers" ? "Tap Next when you are ready." : "Watch and learn this sign"}
        />
        <View style={styles.footer}>
          <PrimaryActionButton label="Next" onPress={handleNext} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
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
