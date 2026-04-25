import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
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
import {
  completeLessonOnce,
  isLessonUnlocked,
  type LessonId,
} from "@/src/features/learn/utils/lessonProgress";

const CURRENT_LESSON_ID: LessonId = "greetings";
const NEXT_LESSON_ID: LessonId = "family";
const NEXT_LESSON_ROUTE = "/learn/family";

// Stars logic: ≥7 correct → 3 stars, ≥5 → 2 stars, else → 1 star
// Stars logic (max 16: 8 match + 8 type): ≥12 → 3 stars, ≥8 → 2 stars, else → 1 star
function calcStars(totalCorrect: number): number {
  if (totalCorrect >= 12) return 3;
  if (totalCorrect >= 8) return 2;
  return 1;
}

export default function GreetingsCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const params = useLocalSearchParams<{ totalCorrect?: string }>();
  const totalCorrect = parseInt(params.totalCorrect ?? "0", 10);
  const starsEarned = calcStars(totalCorrect);

  const [balanceStars, setBalanceStars] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [nextUnlocked, setNextUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function save() {
      const result = await completeLessonOnce(CURRENT_LESSON_ID, starsEarned);
      const unlocked = await isLessonUnlocked(NEXT_LESSON_ID);

      if (!mounted) return;
      setBalanceStars(result.userStars?.balance ?? result.totalStars);
      setLifetimeEarned(result.userStars?.lifetimeEarned ?? result.totalStars);
      setNextUnlocked(unlocked);
      setLoading(false);
    }

    void save();
    return () => { mounted = false; };
  }, [starsEarned]);

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

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Lesson Complete!</Text>

          {/* Stars row */}
          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <Text
                key={i}
                style={[styles.star, { opacity: i <= starsEarned ? 1 : 0.25 }]}
              >
                ⭐
              </Text>
            ))}
          </View>

          {/* Score card */}
          <View style={styles.scoreCard}>
            {loading ? (
              <Text style={styles.scoreNumber}>…</Text>
            ) : (
              <Text style={styles.scoreNumber}>{lifetimeEarned}</Text>
            )}
            <Text style={styles.scoreLabel}>Total stars earned</Text>
            {!loading ? (
              <Text style={styles.balanceHint}>{balanceStars} available now</Text>
            ) : null}
          </View>

          <Text style={styles.earnedText}>
            You earned {starsEarned} star{starsEarned !== 1 ? "s" : ""} this lesson
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonGroup}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace("/(tabs)/learn" as any)}
          >
            <Text style={styles.primaryButtonText}>Back to Lessons</Text>
          </Pressable>

          {nextUnlocked ? (
            <Pressable
              style={styles.secondaryButton}
              onPress={() => router.push(NEXT_LESSON_ROUTE as any)}
            >
              <Text style={styles.secondaryButtonText}>Next Lesson →</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
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
    content: {
      flex: 1,
      backgroundColor: "#EEF3F1",
      paddingHorizontal: ms(16),
      paddingTop: ms(32),
      paddingBottom: ms(24),
      gap: ms(24),
    },
    card: {
      backgroundColor: "#FFFFFF",
      borderRadius: ms(24),
      padding: ms(24),
      alignItems: "center",
      gap: ms(16),
    },
    title: {
      fontSize: ts(22),
      fontWeight: "800",
      color: "#334155",
      textAlign: "center",
    },
    starsRow: {
      flexDirection: "row",
      gap: ms(8),
    },
    star: {
      fontSize: ts(32),
    },
    scoreCard: {
      backgroundColor: "#EEF7FA",
      borderRadius: ms(18),
      paddingVertical: ms(16),
      paddingHorizontal: ms(40),
      borderWidth: 1.5,
      borderColor: "#D0E8F0",
      alignItems: "center",
    },
    scoreNumber: {
      fontSize: ts(38),
      fontWeight: "800",
      color: "#56BDB4",
    },
    scoreLabel: {
      fontSize: ts(12),
      fontWeight: "600",
      color: "#94A3B8",
      marginTop: ms(4),
    },
    balanceHint: {
      fontSize: ts(13),
      fontWeight: "600",
      color: "#64748B",
      marginTop: ms(8),
    },
    earnedText: {
      fontSize: ts(14),
      fontWeight: "600",
      color: "#334155",
      textAlign: "center",
    },
    buttonGroup: {
      gap: ms(12),
    },
    primaryButton: {
      height: ms(56),
      borderRadius: ms(24),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    primaryButtonText: {
      color: "#FFFFFF",
      fontSize: ts(17),
      fontWeight: "700",
    },
    secondaryButton: {
      height: ms(56),
      borderRadius: ms(24),
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#56BDB4",
    },
    secondaryButtonText: {
      color: "#56BDB4",
      fontSize: ts(17),
      fontWeight: "700",
    },
  });
};
