import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  QuizAnswerButton,
  SignLessonCard,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { lessonSpacing, Spacing } from "@/src/theme";
import { lessonColors } from "@/src/theme/colors";
import {
  buildQuizOptions,
  calculateProgress,
  getLessonSigns,
  getSignByOrder,
} from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

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
      <AppShell scroll={false} header={<LearnFlowHeader title="Quiz" />}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not find this sign.</Text>
        </View>
      </AppShell>
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
    <AppShell scroll={false} header={<LearnFlowHeader title="Quiz" />}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LessonHeader title="Choose the correct meaning" />
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
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton
            label={submitted ? "Continue" : "Check"}
            onPress={handleContinue}
            disabled={!selected}
          />
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
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: lessonSpacing.sm,
  },
  grid: {
    marginTop: lessonSpacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: lessonSpacing.sm,
  },
  feedback: {
    marginTop: lessonSpacing.md,
    textAlign: "center",
    fontSize: 16,
    lineHeight: 22,
    color: lessonColors.textSecondary,
  },
  correct: {
    color: lessonColors.success,
  },
  incorrect: {
    color: lessonColors.error,
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
