import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  SignLessonCard,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { lessonSpacing, Spacing } from "@/src/theme";
import { lessonColors } from "@/src/theme/colors";
import { calculateProgress, getSignByOrder } from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function LearnSignScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; order?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const order = Number(params.order ?? "1");
  const score = Number(params.score ?? "0");

  const sign = getSignByOrder(lessonId, order);
  const progress = calculateProgress(lessonId, order, "learn");

  if (!sign) {
    return (
      <AppShell scroll={false} header={<LearnFlowHeader title="Learn" />}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>This lesson does not have signs yet.</Text>
        </View>
      </AppShell>
    );
  }

  const handleNext = () => {
    router.push({
      pathname: "/learn/quiz-sign",
      params: {
        lessonId,
        order: String(order),
        score: String(score),
      },
    } as any);
  };

  return (
    <AppShell scroll={false} header={<LearnFlowHeader title="Learn" />}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LessonHeader title={sign.label} subtitle="Watch the sign and remember the meaning." />
          <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />
          <SignLessonCard gif={sign.gif} label={sign.label} instruction="Tap Next when you are ready." />
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton label="Next" onPress={handleNext} />
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.screenPadding,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: lessonSpacing.sm,
    flexGrow: 1,
  },
  footer: {
    flexShrink: 0,
    alignItems: "center",
    paddingBottom: lessonSpacing.lg,
    paddingTop: lessonSpacing.sm,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 200,
  },
  emptyText: {
    color: lessonColors.textSecondary,
    fontSize: 16,
    textAlign: "center",
  },
});
