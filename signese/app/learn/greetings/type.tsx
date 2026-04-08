import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import {
  ScreenContainer,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { GREETINGS_LEARN_ITEMS } from "@/src/features/learn/data/greetings";

// Normalize: trim, lowercase, strip all non-letter characters
// Matches "Whats your name", "what's your name?", "WHATS YOUR NAME" etc.
function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function GreetingsTypeScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const params = useLocalSearchParams<{ matchScore?: string }>();
  const matchScore = parseInt(params.matchScore ?? "0", 10);

  const questions = useMemo(() => shuffleArray(GREETINGS_LEARN_ITEMS), []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [answered, setAnswered] = useState(false);
  const [typeCorrect, setTypeCorrect] = useState(0);

  const currentItem = questions[currentIndex];
  const total = questions.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const handleCheckAnswer = () => {
    if (!inputValue.trim()) {
      setFeedback("Please type your answer first.");
      setIsCorrect(false);
      return;
    }

    const correct = normalize(inputValue) === normalize(currentItem.label);

    if (correct) {
      setTypeCorrect((n) => n + 1);
      setFeedback("Correct! ✓");
      setIsCorrect(true);
    } else {
      setFeedback(`Accepted: "${currentItem.label}"`);
      setIsCorrect(false);
    }
    setAnswered(true);
  };

  const handleNext = () => {
    const nextIndex = currentIndex + 1;

    if (nextIndex < total) {
      setCurrentIndex(nextIndex);
      setInputValue("");
      setFeedback("");
      setIsCorrect(null);
      setAnswered(false);
      return;
    }

    // All done — go to complete
    router.push({
      pathname: "/learn/greetings/complete" as any,
      params: { totalCorrect: String(matchScore + typeCorrect + (isCorrect ? 1 : 0)) },
    });
  };

  const isLast = currentIndex === total - 1;

  return (
    <ScreenContainer backgroundColor="#EEF3F1">
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Greetings</Text>
        <View style={styles.headerRight}>
          <HeaderActionButton
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings" as any)}
          />
          <HeaderAvatarButton
            avatar={headerProfileIcon.emoji}
            onPress={() => router.push("/(tabs)/account" as any)}
          />
        </View>
      </View>

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Type</Text>
          <Text style={styles.progressLabel}>{currentIndex + 1}/{total}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Card */}
        <View style={styles.card}>
          <View style={styles.gifArea}>
            <Image
              source={currentItem.image}
              style={styles.gifImage}
              contentFit="cover"
              autoplay
            />
          </View>
          <Text style={styles.subtitle}>What does this sign mean?</Text>
        </View>

        {/* Input */}
        <TextInput
          value={inputValue}
          onChangeText={(text) => {
            setInputValue(text);
            if (answered) {
              setFeedback("");
              setIsCorrect(null);
              setAnswered(false);
            }
          }}
          placeholder="Type your answer"
          placeholderTextColor="#7B8794"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!answered}
          style={[
            styles.answerInput,
            isCorrect === true && styles.answerInputCorrect,
            isCorrect === false && answered && styles.answerInputWrong,
          ]}
          onSubmitEditing={!answered ? handleCheckAnswer : undefined}
          returnKeyType="done"
        />

        {/* Feedback */}
        {!!feedback && (
          <Text
            style={[
              styles.feedbackText,
              isCorrect ? styles.correctText : styles.incorrectText,
            ]}
          >
            {feedback}
          </Text>
        )}

        {/* Button */}
        {!answered ? (
          <Pressable
            style={[styles.actionButton, !inputValue.trim() && styles.actionButtonDisabled]}
            onPress={handleCheckAnswer}
            disabled={!inputValue.trim()}
          >
            <Text style={styles.actionButtonText}>Check Answer</Text>
          </Pressable>
        ) : (
          <Pressable style={styles.actionButton} onPress={handleNext}>
            <Text style={styles.actionButtonText}>
              {isLast ? "Finish" : "Next"}
            </Text>
          </Pressable>
        )}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (v: number) => moderateScale(v) * density;
  const ts = (v: number) => ms(v) * textScale;

  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: ms(16),
      paddingVertical: ms(10),
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
    progressStrip: {
      backgroundColor: "#EEF3F1",
      paddingHorizontal: ms(16),
      paddingTop: ms(6),
    },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: ms(4),
    },
    progressLabel: {
      fontSize: ts(12),
      fontWeight: "700",
      color: "#334155",
    },
    progressTrack: {
      height: ms(8),
      borderRadius: ms(99),
      backgroundColor: "#F4B7A0",
      overflow: "hidden",
      marginBottom: ms(12),
    },
    progressFill: {
      height: "100%",
      borderRadius: ms(99),
      backgroundColor: "#56BDB4",
    },
    card: {
      marginHorizontal: ms(16),
      marginBottom: ms(8),
      backgroundColor: "#FAFAFA",
      borderRadius: ms(24),
      padding: ms(16),
      alignItems: "center",
    },
    gifArea: {
      width: "100%",
      maxWidth: ms(240),
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: ms(16),
      overflow: "hidden",
      backgroundColor: "#EEF7FA",
      marginBottom: ms(12),
    },
    gifImage: {
      width: "100%",
      height: "100%",
    },
    subtitle: {
      fontSize: ts(15),
      fontWeight: "600",
      color: "#64748B",
      textAlign: "center",
    },
    answerInput: {
      marginHorizontal: ms(28),
      minHeight: ms(52),
      borderRadius: ms(26),
      borderWidth: 2,
      borderColor: "#DCE7E7",
      backgroundColor: "#F7FAFA",
      paddingHorizontal: ms(20),
      fontSize: ts(16),
      color: "#334155",
    },
    answerInputCorrect: {
      borderColor: "#56BDB4",
      backgroundColor: "#E1F5EE",
    },
    answerInputWrong: {
      borderColor: "#E24B4A",
      backgroundColor: "#FCEBEB",
    },
    feedbackText: {
      marginTop: ms(10),
      textAlign: "center",
      fontSize: ts(14),
      fontWeight: "700",
      marginHorizontal: ms(28),
    },
    correctText: {
      color: "#15803D",
    },
    incorrectText: {
      color: "#B91C1C",
    },
    actionButton: {
      marginTop: ms(16),
      marginHorizontal: ms(28),
      marginBottom: ms(16),
      height: ms(52),
      borderRadius: ms(22),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    actionButtonDisabled: {
      backgroundColor: "#B0D4D1",
    },
    actionButtonText: {
      color: "#FFFFFF",
      fontSize: ts(16),
      fontWeight: "700",
    },
  });
};
