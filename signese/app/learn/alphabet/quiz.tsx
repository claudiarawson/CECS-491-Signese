import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  ScreenContainer,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import {
  getDeviceDensity,
  moderateScale,
} from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
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
  const wrongChoices = shuffleArray(
    allLetters.filter((letter) => letter !== correctAnswer)
  ).slice(0, 3);

  return shuffleArray([correctAnswer, ...wrongChoices]);
}

export default function AlphabetQuizScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const questions = useMemo(() => {
    return shuffleArray(ALPHABET_LEARN_ITEMS).slice(0, 10);
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentItem = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  // placeholder correct answer for now
  const correctAnswer = "A";

  const choices = useMemo(() => {
    return buildChoices(correctAnswer);
  }, [currentIndex]);

  React.useEffect(() => {
    // Entering screen 3 implies two screens are complete.
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

    // Only mark full lesson-path completion when user finishes the final quiz item.
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

  return (
    <ScreenContainer backgroundColor="#EEF3F1">
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/(tabs)/learn")}>
          <MaterialIcons name="chevron-left" size={32} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Alphabet Quiz</Text>

        <View style={styles.headerRight}>
          <HeaderActionButton
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings" as any)}
          />
          <HeaderAvatarButton
            avatar={headerProfileIcon.emoji}
            onPress={() => router.push("/(tabs)/account")}
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressTopRow}>
          <Text style={styles.progressLabel}>Multiple Choice</Text>
          <Text style={styles.progressCount}>
            {currentIndex + 1}/{total}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.card}>
          <Text style={styles.promptText}>Which letter is this?</Text>
          <Text style={styles.bigLetter}>A</Text>
        </View>

        <View style={styles.choicesContainer}>
          {choices.map((choice) => {
            const isSelected = selectedAnswer === choice;

            return (
              <Pressable
                key={choice}
                style={[
                  styles.choiceButton,
                  isSelected && styles.choiceButtonSelected,
                ]}
                onPress={() => setSelectedAnswer(choice)}
              >
                <Text
                  style={[
                    styles.choiceText,
                    isSelected && styles.choiceTextSelected,
                  ]}
                >
                  {choice}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {!!feedback && (
          <Text
            style={[
              styles.feedbackText,
              isCorrect === true ? styles.correctText : styles.incorrectText,
            ]}
          >
            {feedback}
          </Text>
        )}

        {!answered ? (
          <Pressable style={styles.actionButton} onPress={handleCheckAnswer}>
            <Text style={styles.actionButtonText}>Check Answer</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionButton} onPress={goToNext}>
            <Text style={styles.actionButtonText}>
              {currentIndex < total - 1 ? "Next" : "Finish"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: ms(20),
      paddingTop: ms(8),
      paddingBottom: ms(10),
      backgroundColor: "#FFFFFF",
    },
    backButton: {
      width: ms(56),
      height: ms(56),
      borderRadius: ms(28),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      marginLeft: ms(12),
      fontSize: ts(22),
      lineHeight: ts(28),
      fontWeight: "800",
      color: "#111111",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(8),
    },
    scrollContent: {
      paddingBottom: ms(28),
    },
    progressTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: ms(28),
      marginTop: ms(8),
    },
    progressLabel: {
      fontSize: ts(17),
      lineHeight: ts(22),
      color: "#64748B",
    },
    progressCount: {
      fontSize: ts(17),
      lineHeight: ts(22),
      color: "#64748B",
    },
    progressTrack: {
      height: ms(20),
      borderRadius: ms(12),
      backgroundColor: "#F4B7A0",
      marginHorizontal: ms(28),
      marginTop: ms(12),
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#56BDB4",
      borderRadius: ms(12),
    },
    card: {
      marginTop: ms(28),
      marginHorizontal: ms(28),
      backgroundColor: "#FAFAFA",
      borderRadius: ms(34),
      paddingHorizontal: ms(20),
      paddingVertical: ms(30),
      alignItems: "center",
    },
    promptText: {
      fontSize: ts(20),
      lineHeight: ts(26),
      color: "#64748B",
      textAlign: "center",
      marginBottom: ms(20),
    },
    bigLetter: {
      fontSize: ts(72),
      lineHeight: ts(82),
      fontWeight: "800",
      color: "#111111",
    },
    choicesContainer: {
      marginTop: ms(24),
      marginHorizontal: ms(28),
      gap: ms(14),
    },
    choiceButton: {
      minHeight: ms(64),
      borderRadius: ms(24),
      backgroundColor: "#FFFFFF",
      borderWidth: ms(3),
      borderColor: "#DCE7E7",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(16),
    },
    choiceButtonSelected: {
      borderColor: "#56BDB4",
      backgroundColor: "#E8F8F6",
    },
    choiceText: {
      fontSize: ts(22),
      lineHeight: ts(28),
      fontWeight: "700",
      color: "#111111",
    },
    choiceTextSelected: {
      color: "#0F766E",
    },
    feedbackText: {
      marginTop: ms(16),
      textAlign: "center",
      fontSize: ts(18),
      lineHeight: ts(24),
      fontWeight: "700",
      marginHorizontal: ms(40),
    },
    correctText: {
      color: "#15803D",
    },
    incorrectText: {
      color: "#B91C1C",
    },
    actionButton: {
      marginTop: ms(24),
      marginHorizontal: ms(56),
      minHeight: ms(76),
      borderRadius: ms(28),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: ts(22),
      lineHeight: ts(28),
      fontWeight: "700",
    },
  });
};