import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import {
  completeLessonOnce,
  isLessonUnlocked,
  type LessonId,
} from "@/src/features/learn/utils/lessonProgress";
import {
  fontFamily,
  getDeviceDensity,
  moderateScale,
  Spacing,
} from "@/src/theme";

const CURRENT_LESSON_ID: LessonId = "greetings";
const NEXT_LESSON_ID: LessonId = "family";
const NEXT_LESSON_ROUTE = "/learn/family";

function calcStars(totalCorrect: number): number {
  if (totalCorrect >= 12) return 3;
  if (totalCorrect >= 8) return 2;
  return 1;
}

export default function GreetingsCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const styles = useMemo(() => createStyles(ms), [ms]);

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
    return () => {
      mounted = false;
    };
  }, [starsEarned]);

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
      header={
        <LearnFlowHeader title="Greetings" onBackPress={() => router.back()} rightExtra={headerRight} />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Lesson complete!</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3].map((i) => (
              <Text key={i} style={[styles.star, { opacity: i <= starsEarned ? 1 : 0.25 }]}>
                ⭐
              </Text>
            ))}
          </View>

          <View style={styles.scoreCard}>
            {loading ? <Text style={styles.scoreNumber}>…</Text> : <Text style={styles.scoreNumber}>{lifetimeEarned}</Text>}
            <Text style={styles.scoreLabel}>Total stars earned</Text>
            {!loading ? <Text style={styles.balanceHint}>{balanceStars} available now</Text> : null}
          </View>

          <Text style={styles.earnedText}>
            You earned {starsEarned} star{starsEarned !== 1 ? "s" : ""} this lesson
          </Text>
        </View>

        <PrimaryActionButton label="Back to lessons" onPress={() => router.replace("/(tabs)/learn" as any)} />

        {nextUnlocked ? (
          <View style={styles.secondaryWrap}>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.82 }]}
              onPress={() => router.push(NEXT_LESSON_ROUTE as any)}
              accessibilityRole="button"
              accessibilityLabel="Go to next lesson"
            >
              <Text style={styles.secondaryButtonText}>Next lesson →</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const createStyles = (ms: (v: number) => number) =>
  StyleSheet.create({
    headerIcon: {
      padding: ms(4),
    },
    scroll: {
      flex: 1,
      minHeight: 0,
    },
    scrollContent: {
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: ms(44),
      paddingTop: ms(12),
      alignItems: "center",
      gap: ms(20),
    },
    card: {
      width: "100%",
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      padding: ms(24),
      alignItems: "center",
      gap: ms(14),
      ...asl.shadow.card,
    },
    title: {
      fontSize: ms(22),
      fontFamily: fontFamily.heading,
      color: asl.text.primary,
      textAlign: "center",
    },
    starsRow: {
      flexDirection: "row",
      gap: ms(8),
    },
    star: {
      fontSize: ms(34),
      lineHeight: ms(42),
    },
    scoreCard: {
      marginTop: ms(4),
      width: "100%",
      borderRadius: ms(18),
      paddingVertical: ms(14),
      paddingHorizontal: ms(28),
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.2)",
      alignItems: "center",
    },
    scoreNumber: {
      fontSize: ms(42),
      lineHeight: ms(48),
      fontFamily: fontFamily.heading,
      color: asl.accentCyan,
    },
    scoreLabel: {
      fontSize: ms(12),
      fontFamily: fontFamily.medium,
      color: asl.text.secondary,
      marginTop: ms(6),
      textAlign: "center",
    },
    balanceHint: {
      fontSize: ms(13),
      fontFamily: fontFamily.medium,
      color: asl.text.muted,
      marginTop: ms(10),
      textAlign: "center",
    },
    earnedText: {
      fontSize: ms(14),
      fontFamily: fontFamily.medium,
      color: asl.text.secondary,
      textAlign: "center",
    },
    secondaryWrap: {
      width: "100%",
      maxWidth: 320,
      marginTop: ms(8),
      alignSelf: "center",
    },
    secondaryButton: {
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(255,255,255,0.06)",
      minHeight: 52,
      paddingHorizontal: ms(20),
      width: "100%",
      maxWidth: 288,
    },
    secondaryButtonText: {
      fontSize: ms(15),
      fontFamily: fontFamily.heading,
      color: asl.text.primary,
    },
  });
