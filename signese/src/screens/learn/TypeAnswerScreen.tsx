import {
  LessonHeader,
  LessonProgressBar,
  PrimaryActionButton,
  SignLessonCard,
  TypingAnswerInput,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { lessonSpacing, Spacing } from "@/src/theme";
import { useLessonPalette, type LessonPalette } from "@/src/contexts/ThemeContext";
import {
  calculateProgress,
  getNextSign,
  getSignByOrder,
  isTypedAnswerCorrect,
} from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function TypeAnswerScreen() {
  const lc = useLessonPalette();
  const styles = useMemo(() => createStyles(lc), [lc]);
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
      <AppShell scroll={false} header={<LearnFlowHeader title="Type answer" />}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not find this sign.</Text>
        </View>
      </AppShell>
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
    <AppShell scroll={false} header={<LearnFlowHeader title="Type answer" />}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
            <Text style={[styles.feedbackLine, isCorrect ? styles.correct : styles.incorrect]}>{feedback}</Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton
            label={submitted ? "Continue" : "Submit"}
            onPress={handleSubmitOrContinue}
            disabled={!submitted && value.trim().length === 0}
          />
        </View>
      </View>
    </AppShell>
  );
}

const createStyles = (lc: LessonPalette) =>
  StyleSheet.create({
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
    inputWrap: {
      marginTop: lessonSpacing.md,
    },
    feedbackLine: {
      marginTop: lessonSpacing.md,
      textAlign: "center",
      fontSize: 16,
      lineHeight: 22,
      color: lc.textSecondary,
    },
    correct: {
      color: lc.success,
    },
    incorrect: {
      color: lc.error,
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
      color: lc.textSecondary,
      fontSize: 16,
      textAlign: "center",
    },
  });
