import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import {
  completeLessonOnce,
  isLessonUnlocked,
  type LessonId} from "@/src/features/learn/utils/lessonProgress";
import {
  fontWeight,
  getDeviceDensity,
  moderateScale,
  Spacing} from "@/src/theme";

const CURRENT_LESSON_ID: LessonId = "alphabet";
const CURRENT_LESSON_TITLE = "Alphabet";
const NEXT_LESSON_ID: LessonId = "numbers";
const NEXT_LESSON_TITLE = "Numbers";
const STARS_EARNED = 3;

export default function AlphabetCompleteScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const styles = useMemo(() => createStyles(ms), [ms]);

  const [balanceStars, setBalanceStars] = useState(0);
  const [lifetimeEarned, setLifetimeEarned] = useState(0);
  const [nextLessonUnlocked, setNextLessonUnlocked] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function saveProgress() {
      const result = await completeLessonOnce(CURRENT_LESSON_ID, STARS_EARNED);
      const unlockedNow = await isLessonUnlocked(NEXT_LESSON_ID);

      if (!mounted) return;

      setBalanceStars(result.userStars?.balance ?? result.totalStars);
      setLifetimeEarned(result.userStars?.lifetimeEarned ?? result.totalStars);
      setAlreadyCompleted(result.alreadyCompleted);
      setNextLessonUnlocked(unlockedNow);
      setLoading(false);
    }

    void saveProgress();

    return () => {
      mounted = false;
    };
  }, []);

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
        <LearnFlowHeader
          title={CURRENT_LESSON_TITLE}
          onBackPress={() => router.replace("/(tabs)/learn")}
          rightExtra={headerRight}
        />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.completeText}>Lesson complete!</Text>

        <Text style={styles.starsRow}>⭐ ⭐ ⭐</Text>

        <View style={styles.starsCard}>
          <Text style={styles.bigStarsNumber}>{STARS_EARNED}</Text>
          <Text style={styles.starsLabel}>
            {alreadyCompleted ? "Stars already earned" : "Stars earned"}
          </Text>

          <Text style={styles.totalStarsText}>
            {loading ? "…" : `Total earned: ${lifetimeEarned} · Available: ${balanceStars}`}
          </Text>
        </View>

        <View style={styles.unlockCard}>
          <Text style={styles.unlockTitle}>Next lesson: {NEXT_LESSON_TITLE}</Text>

          {loading ? (
            <Text style={styles.unlockSubtitle}>Checking unlock status…</Text>
          ) : nextLessonUnlocked ? (
            <Text style={styles.unlockSuccess}>Unlocked!</Text>
          ) : (
            <Text style={styles.unlockSubtitle}>Complete this lesson to unlock it</Text>
          )}
        </View>

        <PrimaryActionButton label="Continue" onPress={() => router.replace("/(tabs)/learn")} />
      </ScrollView>
    </AppShell>
  );
}

const createStyles = (ms: (n: number) => number) =>
  StyleSheet.create({
    headerIcon: {
      padding: ms(4)},
    scroll: {
      flex: 1,
      minHeight: 0},
    scrollContent: {
      alignItems: "center",
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(32),
      paddingBottom: ms(56),
      gap: ms(8)},
    completeText: {
      fontSize: ms(28),
      fontWeight: fontWeight.emphasis,
      color: asl.text.primary,
      textAlign: "center"},
    starsRow: {
      marginTop: ms(18),
      fontSize: ms(36),
      lineHeight: ms(42)},
    starsCard: {
      marginTop: ms(24),
      width: "100%",
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      paddingVertical: ms(26),
      alignItems: "center",
      ...asl.shadow.card},
    bigStarsNumber: {
      fontSize: ms(44),
      lineHeight: ms(52),
      fontWeight: fontWeight.emphasis,
      color: "#FBBF24"},
    starsLabel: {
      marginTop: ms(8),
      fontSize: ms(20),
      fontWeight: fontWeight.medium,
      color: asl.text.secondary},
    totalStarsText: {
      marginTop: ms(12),
      fontSize: ms(15),
      lineHeight: ms(21),
      color: asl.text.muted},
    unlockCard: {
      marginTop: ms(20),
      width: "100%",
      backgroundColor: asl.glass.strong,
      borderRadius: ms(22),
      borderWidth: 1,
      borderColor: asl.glass.border,
      paddingVertical: ms(22),
      paddingHorizontal: ms(16),
      alignItems: "center"},
    unlockTitle: {
      fontSize: ms(18),
      lineHeight: ms(24),
      fontWeight: fontWeight.medium,
      color: asl.text.primary,
      textAlign: "center"},
    unlockSubtitle: {
      marginTop: ms(8),
      fontSize: ms(15),
      lineHeight: ms(21),
      color: asl.text.muted,
      textAlign: "center"},
    unlockSuccess: {
      marginTop: ms(8),
      fontSize: ms(16),
      lineHeight: ms(22),
      color: "#4ADE80",
      fontWeight: fontWeight.medium,
      textAlign: "center"}});
