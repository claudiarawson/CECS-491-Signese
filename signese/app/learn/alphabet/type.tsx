import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  useWindowDimensions,
  ScrollView,
  TextInput} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import { useLessonPalette, type LessonPalette } from "@/src/contexts/ThemeContext";
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

export default function AlphabetTypeScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const lc = useLessonPalette();
  const styles = useMemo(() => createStyles(ms, lc), [ms, lc]);

  const questions = useMemo(() => shuffleArray(ALPHABET_LEARN_ITEMS).slice(0, 10), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentItem = questions[currentIndex];
  React.useEffect(() => {
    void setLessonStepProgress("alphabet", 1);
  }, []);

  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const goToNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue("");
      setFeedback("");
      setIsCorrect(null);
      setAnswered(false);
      return;
    }

    void setLessonStepProgress("alphabet", 2);
    router.push("/learn/alphabet/quiz");
  };

  const handleCheckAnswer = () => {
    if (!currentItem) return;
    const userAnswer = inputValue.trim().toUpperCase();
    const correctAnswer = currentItem.letter.toUpperCase();

    if (!userAnswer) {
      setFeedback("Please type your answer first.");
      setIsCorrect(false);
      setAnswered(false);
      return;
    }

    if (userAnswer === correctAnswer) {
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
        <MaterialIcons name="settings" size={24} color="#000000" />
      </Pressable>
      <Pressable onPress={() => router.push("/(tabs)/account")} hitSlop={8} style={styles.headerIcon}>
        <MaterialIcons name="account-circle" size={26} color="#000000" />
      </Pressable>
    </>
  );

  return (
    <AppShell
      scroll={false}
      header={
        <LearnFlowHeader title="Alphabet" onBackPress={() => router.back()} rightExtra={headerRight} />
      }
    >
      <View style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>Type</Text>
            <Text style={styles.progressCount}>
              {currentIndex + 1}/{total}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.card}>
            <Image source={currentItem.image} style={styles.lessonImage} resizeMode="contain" />
            <Text style={styles.subtitle}>What letter is this?</Text>
          </View>

          <TextInput
            value={inputValue}
            onChangeText={(text) => {
              setInputValue(text.replace(/[^a-zA-Z]/g, "").toUpperCase());
              setFeedback("");
              setIsCorrect(null);
            }}
            placeholder="Type a letter (A-Z)"
            placeholderTextColor="rgba(0,0,0,0.45)"
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={1}
            style={styles.answerInput}
          />

          {!!feedback ? (
            <Text
              style={[
                styles.feedbackText,
                isCorrect === true ? styles.correctText : styles.incorrectText,
              ]}
            >
              {feedback}
            </Text>
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

const createStyles = (ms: (n: number) => number, lc: LessonPalette) =>
  StyleSheet.create({
    inner: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding},
    headerIcon: { padding: ms(4) },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: ms(28),
      gap: ms(4),
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
      color: "#000000"},
    progressCount: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: "#000000"},
    progressTrack: {
      width: "100%",
      height: ms(10),
      borderRadius: ms(99),
      backgroundColor: lc.progressBackground,
      marginTop: ms(12),
      overflow: "hidden"},
    progressFill: {
      height: "100%",
      backgroundColor: lc.progressFill,
      borderRadius: ms(99)},
    card: {
      marginTop: ms(20),
      width: "100%",
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      paddingHorizontal: ms(18),
      paddingVertical: ms(20),
      alignItems: "center",
      ...asl.shadow.card},
    lessonImage: {
      width: "100%",
      maxWidth: ms(300),
      height: ms(220),
      marginBottom: ms(14),
      backgroundColor: "rgba(0,0,0,0.35)",
      borderRadius: ms(14)},
    subtitle: {
      fontSize: ms(17),
      lineHeight: ms(23),
      color: "#000000",
      textAlign: "center",
      fontWeight: fontWeight.medium},
    answerInput: {
      alignSelf: "stretch",
      marginTop: ms(22),
      minHeight: ms(54),
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingHorizontal: ms(18),
      fontSize: ms(20),
      color: "#000000",
      fontWeight: fontWeight.medium,
      textAlign: "center",
      width: ms(140),
      maxWidth: "100%"},
    feedbackText: {
      marginTop: ms(14),
      textAlign: "center",
      fontSize: ms(16),
      marginHorizontal: ms(24),
      fontWeight: fontWeight.medium},
    correctText: {
      color: lc.success},
    incorrectText: {
      color: lc.error}});
