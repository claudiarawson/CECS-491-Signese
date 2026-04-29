import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView, Image } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import { lessonColors } from "@/src/theme/colors";
import {
  fontWeight,
  getDeviceDensity,
  moderateScale,
  Spacing} from "@/src/theme";
import { ALPHABET_LEARN_ITEMS } from "@/src/features/learn/data/alphabet";
import { setLessonStepProgress } from "@/src/features/learn/utils/lessonProgress";

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildChoices(correctAnswer: string) {
  const allLetters = ALPHABET_LEARN_ITEMS.map((item) => item.letter.toUpperCase());
  const wrongChoices = shuffleArray(allLetters.filter((letter) => letter !== correctAnswer)).slice(0, 3);
  return shuffleArray([correctAnswer, ...wrongChoices]);
}

export default function AlphabetQuizScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const styles = useMemo(() => createStyles(ms), [ms]);

  const questions = useMemo(() => shuffleArray(ALPHABET_LEARN_ITEMS).slice(0, 10), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentItem = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const correctAnswer = currentItem?.letter.toUpperCase() ?? "A";

  const choices = useMemo(() => buildChoices(correctAnswer), [correctAnswer]);

  React.useEffect(() => {
    void setLessonStepProgress("alphabet", 2);
  }, []);

  const goToNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setFeedback("");
      setIsCorrect(null);
      setAnswered(false);
      return;
    }

    void setLessonStepProgress("alphabet", 3);
    router.push("/learn/alphabet/complete");
  };

  const handleCheckAnswer = () => {
    if (!selectedAnswer) {
      setFeedback("Please choose an answer first.");
      setIsCorrect(false);
      setAnswered(false);
      return;
    }

    if (selectedAnswer === correctAnswer) {
      setFeedback("Correct!");
      setIsCorrect(true);
      setAnswered(true);
    } else {
      setFeedback("Incorrect. Try again.");
      setIsCorrect(false);
      setAnswered(false);
    }
  };

  const headerRight = (
    <>
      <Pressable onPress={() => router.push("/(tabs)/settings" as any)} hitSlop={8} style={styles.headerIcon}>
        <MaterialIcons name="settings" size={24} color={asl.text.secondary} />
      </Pressable>
      <Pressable onPress={() => router.push("/(tabs)/account")} hitSlop={8} style={styles.headerIcon}>
        <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
      </Pressable>
    </>
  );

  return (
    <AppShell
      scroll={false}
      header={<LearnFlowHeader title="Alphabet quiz" onBackPress={() => router.back()} rightExtra={headerRight} />}
    >
      <View style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>Quiz</Text>
            <Text style={styles.progressCount}>
              {currentIndex + 1}/{total}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.card}>
            <Text style={styles.promptText}>Which letter is this?</Text>
            {currentItem ? (
              <Image source={currentItem.image} style={styles.promptImage} resizeMode="contain" />
            ) : null}
            <Text style={styles.hintMuted}>Tap the matching letter below.</Text>
          </View>

          <View style={styles.choicesContainer}>
            {choices.map((choice) => {
              const isSelected = selectedAnswer === choice;
              return (
                <Pressable
                  key={choice}
                  style={[styles.choiceButton, isSelected && styles.choiceButtonSelected]}
                  onPress={() => setSelectedAnswer(choice)}
                  accessibilityRole="button"
                  accessibilityLabel={`Letter ${choice}`}
                >
                  <Text style={[styles.choiceText, isSelected && styles.choiceTextSelected]}>{choice}</Text>
                </Pressable>
              );
            })}
          </View>

          {!!feedback ? (
            <Text style={[styles.feedbackText, isCorrect === true ? styles.correctText : styles.incorrectText]}>{feedback}</Text>
          ) : null}

          {!answered ? (
            <PrimaryActionButton label="Check answer" onPress={handleCheckAnswer} />
          ) : (
            <PrimaryActionButton label={currentIndex < total - 1 ? "Next" : "Finish"} onPress={goToNext} />
          )}
        </ScrollView>
      </View>
    </AppShell>
  );
}

const createStyles = (ms: (n: number) => number) =>
  StyleSheet.create({
    inner: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding},
    headerIcon: { padding: ms(4) },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: ms(28),
      alignItems: "center"},
    progressTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginTop: ms(8)},
    progressLabel: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: asl.text.secondary},
    progressCount: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: asl.text.secondary},
    progressTrack: {
      width: "100%",
      height: ms(10),
      borderRadius: ms(99),
      backgroundColor: lessonColors.progressBackground,
      marginTop: ms(12),
      overflow: "hidden"},
    progressFill: {
      height: "100%",
      backgroundColor: lessonColors.progressFill,
      borderRadius: ms(99)},
    card: {
      marginTop: ms(20),
      width: "100%",
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      paddingHorizontal: ms(18),
      paddingVertical: ms(22),
      alignItems: "center",
      gap: ms(10),
      ...asl.shadow.card},
    promptText: {
      fontSize: ms(18),
      lineHeight: ms(24),
      color: asl.text.primary,
      textAlign: "center",
      fontWeight: fontWeight.medium},
    promptImage: {
      width: "100%",
      maxWidth: ms(260),
      height: ms(200),
      backgroundColor: "rgba(0,0,0,0.35)",
      borderRadius: ms(14)},
    hintMuted: {
      fontSize: ms(13),
      color: asl.text.muted},
    choicesContainer: {
      marginTop: ms(22),
      width: "100%",
      gap: ms(12)},
    choiceButton: {
      minHeight: ms(54),
      borderRadius: ms(16),
      backgroundColor: "rgba(255,255,255,0.06)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(14)},
    choiceButtonSelected: {
      borderColor: lessonColors.progressFill,
      backgroundColor: "rgba(34,211,238,0.14)"},
    choiceText: {
      fontSize: ms(22),
      fontWeight: fontWeight.emphasis,
      color: asl.text.primary},
    choiceTextSelected: {
      color: lessonColors.progressFill},
    feedbackText: {
      marginTop: ms(14),
      textAlign: "center",
      fontSize: ms(16),
      marginHorizontal: ms(20),
      fontWeight: fontWeight.medium},
    correctText: { color: lessonColors.success },
    incorrectText: { color: lessonColors.error }});
