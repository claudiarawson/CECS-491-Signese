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
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import { lessonColors } from "@/src/theme/colors";
import {
  fontFamily,
  getDeviceDensity,
  moderateScale,
  Spacing,
} from "@/src/theme";
import { GREETINGS_LEARN_ITEMS } from "@/src/features/learn/data/greetings";

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
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const styles = useMemo(() => createStyles(ms), [ms]);

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

    router.push({
      pathname: "/learn/greetings/complete" as any,
      params: { totalCorrect: String(matchScore + typeCorrect + (isCorrect ? 1 : 0)) },
    });
  };

  const isLast = currentIndex === total - 1;

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
      header={<LearnFlowHeader title="Greetings" onBackPress={() => router.back()} rightExtra={headerRight} />}
    >
      <KeyboardAvoidingView
        style={styles.kb}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.shell}>
          <View style={styles.progressStrip}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>Type</Text>
              <Text style={styles.progressLabel}>
                {currentIndex + 1}/{total}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
            <View style={styles.card}>
              <View style={styles.gifArea}>
                <Image source={currentItem.image} style={styles.gifImage} contentFit="cover" autoplay />
              </View>
              <Text style={styles.subtitle}>What does this sign mean?</Text>
            </View>

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
              placeholderTextColor={asl.text.muted}
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

            {!!feedback ? (
              <Text
                style={[styles.feedbackText, isCorrect === true ? styles.correctText : styles.incorrectText]}
              >
                {feedback}
              </Text>
            ) : null}

            {!answered ? (
              <PrimaryActionButton label="Check answer" onPress={handleCheckAnswer} disabled={!inputValue.trim()} />
            ) : (
              <PrimaryActionButton label={isLast ? "Finish" : "Next"} onPress={handleNext} />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AppShell>
  );
}

const createStyles = (ms: (v: number) => number) =>
  StyleSheet.create({
    kb: {
      flex: 1,
      minHeight: 0,
    },
    shell: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding,
    },
    headerIcon: {
      padding: ms(4),
    },
    progressStrip: {
      paddingBottom: ms(12),
      paddingTop: ms(8),
    },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: ms(10),
    },
    progressLabel: {
      fontSize: ms(12),
      fontFamily: fontFamily.medium,
      color: asl.text.secondary,
    },
    progressTrack: {
      height: ms(10),
      borderRadius: ms(99),
      backgroundColor: lessonColors.progressBackground,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: ms(99),
      backgroundColor: lessonColors.progressFill,
    },
    scrollInner: {
      paddingBottom: ms(32),
      gap: ms(12),
    },
    card: {
      marginTop: ms(8),
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      padding: ms(16),
      alignItems: "center",
      ...asl.shadow.card,
    },
    gifArea: {
      width: "100%",
      maxWidth: ms(260),
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: ms(18),
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.35)",
      marginBottom: ms(12),
    },
    gifImage: {
      width: "100%",
      height: "100%",
    },
    subtitle: {
      fontSize: ms(15),
      fontFamily: fontFamily.medium,
      color: asl.text.muted,
      textAlign: "center",
    },
    answerInput: {
      minHeight: ms(52),
      borderRadius: ms(14),
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingHorizontal: ms(20),
      fontSize: ms(16),
      fontFamily: fontFamily.medium,
      color: asl.text.primary,
    },
    answerInputCorrect: {
      borderColor: lessonColors.success,
      backgroundColor: "rgba(74,222,128,0.12)",
    },
    answerInputWrong: {
      borderColor: lessonColors.error,
      backgroundColor: "rgba(252,165,165,0.1)",
    },
    feedbackText: {
      marginTop: ms(4),
      textAlign: "center",
      fontSize: ms(14),
      fontFamily: fontFamily.medium,
      marginHorizontal: ms(16),
      lineHeight: ms(20),
    },
    correctText: {
      color: lessonColors.success,
    },
    incorrectText: {
      color: lessonColors.error,
    },
  });
