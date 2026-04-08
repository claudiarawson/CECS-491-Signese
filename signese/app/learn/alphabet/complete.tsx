import React, { useEffect, useMemo, useState } from "react";
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
import {
  completeLessonOnce,
  isLessonUnlocked,
  type LessonId,
} from "@/src/features/learn/utils/lessonProgress";

const CURRENT_LESSON_ID: LessonId = "alphabet";
const CURRENT_LESSON_TITLE = "Alphabet";
const NEXT_LESSON_ID: LessonId = "numbers";
const NEXT_LESSON_TITLE = "Numbers";
const STARS_EARNED = 3;

export default function AlphabetCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const [totalStars, setTotalStars] = useState(0);
  const [nextLessonUnlocked, setNextLessonUnlocked] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function saveProgress() {
      const result = await completeLessonOnce(CURRENT_LESSON_ID, STARS_EARNED);
      const unlockedNow = await isLessonUnlocked(NEXT_LESSON_ID);

      if (!mounted) return;

      setTotalStars(result.totalStars);
      setAlreadyCompleted(result.alreadyCompleted);
      setNextLessonUnlocked(unlockedNow);
      setLoading(false);
    }

    void saveProgress();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ScreenContainer backgroundColor="#DCE8F3">
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/(tabs)/learn")}>
          <MaterialIcons name="chevron-left" size={32} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>{CURRENT_LESSON_TITLE}</Text>

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
        <Text style={styles.completeText}>Lesson Complete!</Text>

        <Text style={styles.starsRow}>⭐ ⭐ ⭐</Text>

        <View style={styles.starsCard}>
          <Text style={styles.bigStarsNumber}>{STARS_EARNED}</Text>
          <Text style={styles.starsLabel}>
            {alreadyCompleted ? "Stars Already Earned" : "Stars Earned"}
          </Text>

          <Text style={styles.totalStarsText}>
            Total Stars: {loading ? "..." : totalStars}
          </Text>
        </View>

        <View style={styles.unlockCard}>
          <Text style={styles.unlockTitle}>Next Lesson: {NEXT_LESSON_TITLE}</Text>

          {loading ? (
            <Text style={styles.unlockSubtitle}>Checking unlock status...</Text>
          ) : nextLessonUnlocked ? (
            <Text style={styles.unlockSuccess}>Unlocked!</Text>
          ) : (
            <Text style={styles.unlockSubtitle}>Complete this lesson to unlock it</Text>
          )}
        </View>

        <Pressable
          style={styles.continueButton}
          onPress={() => router.push("/learn")}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
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
      alignItems: "center",
      paddingHorizontal: ms(28),
      paddingTop: ms(60),
      paddingBottom: ms(60),
    },
    completeText: {
      fontSize: ts(34),
      lineHeight: ts(42),
      fontWeight: "700",
      color: "#5B5B5B",
      textAlign: "center",
    },
    starsRow: {
      marginTop: ms(28),
      fontSize: ts(42),
      lineHeight: ts(50),
    },
    starsCard: {
      marginTop: ms(40),
      width: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: ms(32),
      paddingVertical: ms(28),
      alignItems: "center",
    },
    bigStarsNumber: {
      fontSize: ts(44),
      lineHeight: ts(50),
      fontWeight: "800",
      color: "#F2C318",
    },
    starsLabel: {
      marginTop: ms(8),
      fontSize: ts(24),
      lineHeight: ts(30),
      color: "#5B5B5B",
      fontWeight: "600",
    },
    totalStarsText: {
      marginTop: ms(14),
      fontSize: ts(18),
      lineHeight: ts(24),
      color: "#64748B",
    },
    unlockCard: {
      marginTop: ms(24),
      width: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: ms(28),
      paddingVertical: ms(22),
      paddingHorizontal: ms(18),
      alignItems: "center",
    },
    unlockTitle: {
      fontSize: ts(20),
      lineHeight: ts(26),
      fontWeight: "700",
      color: "#111111",
      textAlign: "center",
    },
    unlockSubtitle: {
      marginTop: ms(8),
      fontSize: ts(17),
      lineHeight: ts(23),
      color: "#64748B",
      textAlign: "center",
    },
    unlockSuccess: {
      marginTop: ms(8),
      fontSize: ts(18),
      lineHeight: ts(24),
      color: "#15803D",
      fontWeight: "700",
      textAlign: "center",
    },
    continueButton: {
      marginTop: ms(50),
      width: "85%",
      minHeight: ms(72),
      borderRadius: ms(30),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    continueText: {
      color: "#4B5563",
      fontSize: ts(28),
      lineHeight: ts(34),
      fontWeight: "700",
    },
  });
};