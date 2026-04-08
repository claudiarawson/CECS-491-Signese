import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  ScrollView,
  TextInput,
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
  semanticColors,
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

export default function AlphabetTypeScreen() {
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
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);

  const currentItem = questions[currentIndex];
  React.useEffect(() => {
    // Entering screen 2 implies only screen 1 is completed.
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

    // Only mark screen 2 complete after the final prompt.
    void setLessonStepProgress("alphabet", 2);
    router.push("/learn/alphabet/quiz");
  };

  const handleCheckAnswer = () => {
  const userAnswer = inputValue.trim().toUpperCase();
  const correctAnswer = "A"; // ✅ placeholder for now

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

  return (
    <ScreenContainer backgroundColor="#EEF3F1">
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Alphabet</Text>

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
          <Text style={styles.progressLabel}>Type</Text>
          <Text style={styles.progressCount}>
            {currentIndex + 1}/{total}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.card}>
          <Image
            source={currentItem.image}
            style={styles.lessonImage}
            resizeMode="contain"
          />
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
          placeholderTextColor="#7B8794"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={1}
          style={styles.answerInput}
        />

        {!!feedback && (
          <Text
            style={[
              styles.feedbackText,
              isCorrect === true
                ? styles.correctText
                : styles.incorrectText,
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
      backgroundColor: "#FFFFFF",
      paddingHorizontal: ms(16),
      paddingBottom: ms(10),
      paddingTop: ms(10),
      gap: ms(12),
    },
    backButton: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: ts(18),
      fontWeight: "800",
      color: "#334155",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(6),
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
      paddingVertical: ms(22),
      alignItems: "center",
    },
    lessonImage: {
      width: "100%",
      maxWidth: ms(340),
      height: ms(300),
      marginBottom: ms(18),
      backgroundColor: "#F7F7F7",
    },
    subtitle: {
      fontSize: ts(18),
      lineHeight: ts(24),
      color: "#64748B",
      textAlign: "center",
    },
    answerInput: {
      marginTop: ms(26),
      marginHorizontal: ms(56),
      minHeight: ms(56),
      borderRadius: ms(28),
      borderWidth: ms(6),
      borderColor: "#DCE7E7",
      backgroundColor: "#F7FAFA",
      paddingHorizontal: ms(22),
      fontSize: ts(18),
      lineHeight: ts(24),
      color: semanticColors.text.primary,
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
      height: ms(52),
      borderRadius: ms(22),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: ts(16),
      fontWeight: "700",
    },
  });
};