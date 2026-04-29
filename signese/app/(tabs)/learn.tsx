import { AppShell, AslTabHeader, LessonCard } from "@/src/components/asl";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  getCompletedLessons,
  getLessonProgressPercent,
  getLessonStepProgress,
  getUnlockedLessons,
  LESSON_STAR_REQUIREMENTS,
  setLessonStepProgress,
  unlockLessonWithStars,
  type LessonId,
} from "@/src/features/learn/utils/lessonProgress";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, useWindowDimensions, View } from "react-native";

const LESSON_ROWS = [
  { id: "alphabet", title: "Alphabet", blurb: "Hand shapes A–Z", level: 1, emoji: "🔤", route: "/learn/alphabet" },
  { id: "numbers", title: "Numbers", blurb: "1–20 and simple counting", level: 1, emoji: "🔢", route: "/learn/numbers" },
  { id: "greetings", title: "Greetings", blurb: "Hi, how are you, thank you", level: 2, emoji: "👋", route: "/learn/greetings" },
  { id: "family", title: "Family", blurb: "Relatives and people", level: 2, emoji: "👨‍👩‍👧", route: "/learn/family" },
  { id: "colors", title: "Colors", blurb: "Basic and descriptive colors", level: 2, emoji: "🎨", route: "/learn/colors" },
  { id: "telling-time", title: "Telling time", blurb: "Clocks and time phrases", level: 3, emoji: "⏰", route: "/learn/telling-time" },
  { id: "food-drink", title: "Food & drink", blurb: "Meals, snacks, and drinks", level: 3, emoji: "🍔", route: "/learn/food-drink" },
] as const;

type Row = (typeof LESSON_ROWS)[number];

const IMPLEMENTED_LESSONS = new Set(["alphabet", "greetings", "numbers"]);

export default function LearnScreen() {
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale, colors), [density, textScale, colors]);

  const [unlockedLessons, setUnlockedLessons] = useState<LessonId[]>([]);
  const [completedLessons, setCompletedLessons] = useState<LessonId[]>([]);
  const [lessonProgressPct, setLessonProgressPct] = useState<Partial<Record<LessonId, number>>>({});
  const [unlockingLessonId, setUnlockingLessonId] = useState<LessonId | null>(null);

  const loadProgress = async () => {
    try {
      const unlocked = await getUnlockedLessons();
      const completed = await getCompletedLessons();
      const alphabetPct = await getLessonProgressPercent("alphabet");
      setUnlockedLessons(unlocked);
      setCompletedLessons(completed);
      setLessonProgressPct({ alphabet: alphabetPct });
    } catch (error) {
      console.warn("Failed to load lesson progress", error);
    }
  };

  useEffect(() => {
    void loadProgress();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadProgress();
    }, [])
  );

  const handleLessonPress = (lesson: Row) => {
    const isUnlocked = unlockedLessons.includes(lesson.id as LessonId);

    if (!isUnlocked) {
      const starsRequired = LESSON_STAR_REQUIREMENTS[lesson.id as LessonId];
      const available = profile?.stars?.balance ?? 0;
      Alert.alert(
        "Lesson locked",
        `${lesson.title} requires ${starsRequired} stars to unlock.\n\nYou have ${available} stars.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unlock",
            onPress: () => {
              void (async () => {
                try {
                  setUnlockingLessonId(lesson.id as LessonId);
                  const result = await unlockLessonWithStars(lesson.id as LessonId);
                  await loadProgress();
                  Alert.alert(
                    "Unlocked",
                    `${lesson.title} is now unlocked. Stars remaining: ${result.starsRemaining}.`
                  );
                } catch (error) {
                  Alert.alert(
                    "Cannot unlock",
                    error instanceof Error ? error.message : "Could not unlock this lesson."
                  );
                } finally {
                  setUnlockingLessonId(null);
                }
              })();
            },
          },
        ]
      );
      return;
    }

    void (async () => {
      if (lesson.id === "alphabet") {
        const isCompleted = completedLessons.includes("alphabet");
        if (isCompleted) {
          Alert.alert(
            "Lesson already completed",
            "You already completed Alphabet. Do you want to retry it?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Retry",
                onPress: () => {
                  void (async () => {
                    await setLessonStepProgress("alphabet", 0);
                    await loadProgress();
                    router.push("/learn/alphabet" as any);
                  })();
                },
              },
            ]
          );
          return;
        }

        const step = await getLessonStepProgress("alphabet");
        if (step >= 3) {
          router.push("/learn/alphabet/complete" as any);
          return;
        }
        if (step === 2) {
          router.push("/learn/alphabet/quiz" as any);
          return;
        }
        if (step === 1) {
          router.push("/learn/alphabet/type" as any);
          return;
        }
      }

      if (!IMPLEMENTED_LESSONS.has(lesson.id)) {
        Alert.alert("Coming soon", `${lesson.title} is not available yet.`);
        return;
      }

      router.push(lesson.route as any);
    })();
  };

  return (
    <AppShell
      header={
        <AslTabHeader title="Learn" onSettings={() => router.push("/(tabs)/settings" as any)} />
      }
    >
      <View style={styles.screenContent}>
        <Text style={styles.sectionLabel}>All classes</Text>
        <Text style={styles.subtle}>Tap a row to start or review.</Text>

        {LESSON_ROWS.map((row) => {
          const isUnlocked = unlockedLessons.includes(row.id as LessonId);
          const isComplete = completedLessons.includes(row.id as LessonId);
          const progress = lessonProgressPct[row.id as LessonId] ?? 0;

          const status: "locked" | "in_progress" | "complete" = !isUnlocked
            ? "locked"
            : isComplete
              ? "complete"
              : "in_progress";

          const right =
            !isUnlocked
              ? `⭐ ${LESSON_STAR_REQUIREMENTS[row.id as LessonId]}`
              : progress > 0 && !isComplete
                ? `${progress}%`
                : undefined;

          return (
            <LessonCard
              key={row.id}
              title={row.title}
              subtitle={`L${row.level} · ${row.blurb}`}
              emoji={row.emoji}
              status={status}
              rightDetail={right}
              disabled={unlockingLessonId === (row.id as LessonId)}
              onPress={() => handleLessonPress(row)}
            />
          );
        })}
      </View>
    </AppShell>
  );
}

const createStyles = (density: number, textScale: number, colors: any) => {
  const ts = (v: number) => moderateScale(v) * density * textScale;

  return StyleSheet.create({
    screenContent: {
      flex: 1,
    },
    sectionLabel: {
      color: colors.text,
      fontSize: ts(20),
      fontWeight: "800",
      marginTop: 4,
    },
    subtle: {
      color: colors.subtext,
      marginBottom: 8,
      fontSize: ts(14),
    },
  });
};