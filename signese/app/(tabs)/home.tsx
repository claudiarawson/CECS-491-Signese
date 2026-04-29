import { DailyTipsCarousel } from "@/src/components/layout";
import { AppShell, AslTabHeader, ProgressCard, StatCard } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";
import { getDeviceDensity, moderateScale, Spacing } from "@/src/theme";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import {
  getCompletedLessons,
  getLessonProgressPercent,
  getTotalStars,
  resetLessonProgress,
} from "@/src/features/learn/utils/lessonProgress";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

export default function HomeScreen() {
  const { textScale } = useAccessibility();
  const { profile, loading, authUser } = useAuthUser();
  const streakCount = profile?.streak?.current ?? 0;

  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [guestStarTotal, setGuestStarTotal] = useState(0);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [alphabetPct, setAlphabetPct] = useState(0);

  const refreshHomeStats = React.useCallback(async () => {
    setStatsLoading(true);
    setStatsError(null);

    try {
      const completed = await getCompletedLessons();
      setCompletedLessonsCount(completed.length);
      setAlphabetPct(await getLessonProgressPercent("alphabet"));

      if (!authUser) {
        const total = await getTotalStars();
        setGuestStarTotal(total);
      }
    } catch (error) {
      console.warn("Failed to load home stats", error);
      setStatsError("Unable to load progress right now.");
    } finally {
      setStatsLoading(false);
    }
  }, [authUser]);

  useFocusEffect(
    React.useCallback(() => {
      void refreshHomeStats();
    }, [refreshHomeStats])
  );

  const handleResetProgress = () => {
    Alert.alert(
      "Reset progress",
      "Clear local lesson progress (unlocks and completed lessons)? Your account streak is unchanged.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await resetLessonProgress();
                await refreshHomeStats();
              } catch (e) {
                console.warn(e);
                Alert.alert("Error", "Could not reset progress.");
              }
            })();
          },
        },
      ]
    );
  };

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const starCount = authUser ? (profile?.stars?.lifetimeEarned ?? 0) : guestStarTotal;

  if (loading) {
    return (
      <View style={styles.loadingOuter}>
        <ActivityIndicator size="large" color={asl.accentCyan} />
        <Text style={styles.loadingText}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <AppShell
      variant="default"
      header={
        <AslTabHeader title="Home" onSettings={() => router.push("/(tabs)/settings" as any)} />
      }
    >
      <View style={styles.greetingWrap}>
        <Text style={styles.greetingLine}>Welcome back</Text>
        <Text style={styles.greetingName}>{profile?.username ?? "learner"}</Text>
      </View>

      {statsLoading ? (
        <View style={styles.starsBox}>
          <ActivityIndicator color={asl.accentCyan} />
          <Text style={styles.starsBoxHint}>Loading stars...</Text>
        </View>
      ) : statsError ? (
        <View style={[styles.starsBox, styles.starsBoxError]} accessibilityRole="alert">
          <Text style={styles.starsBoxErrorText}>{statsError}</Text>
        </View>
      ) : (
        <View
          style={styles.starsBox}
          accessibilityRole="text"
          accessibilityLabel={`${starCount} stars`}
        >
          <Text style={styles.starsBoxLine}>{starCount} stars ⭐</Text>
        </View>
      )}

      <View style={styles.statsRow}>
        <StatCard icon="🔥" value={streakCount} label="Streak" accent="warm" />
        <StatCard icon="📖" value={completedLessonsCount} label="Lessons" accent="cyan" />
      </View>

      <Pressable style={styles.resetButton} onPress={handleResetProgress}>
        <Text style={styles.resetButtonText}>Reset progress (local only)</Text>
      </Pressable>

      <ProgressCard
        title="Your lesson path"
        subtitle="Alphabet, vocabulary, and more"
        percent={alphabetPct}
        emoji="🔤"
        ctaLabel="Continue to Learn"
        onContinue={() => router.push("/(tabs)/learn" as any)}
      />

      <View style={styles.tipsSection}>
        <DailyTipsCarousel />
      </View>
    </AppShell>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    loadingOuter: {
      flex: 1,
      backgroundColor: asl.gradient[0],
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.screenPadding,
    },
    loadingText: {
      marginTop: ms(10),
      color: asl.text.secondary,
      fontSize: ts(14),
    },
    greetingWrap: {
      marginBottom: ms(8),
    },
    greetingLine: {
      color: asl.text.secondary,
      fontSize: ts(16),
    },
    greetingName: {
      color: asl.text.primary,
      fontSize: ts(28),
      fontWeight: "800",
      textDecorationLine: "underline",
    },
    starsBox: {
      borderRadius: ms(16),
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingVertical: ms(14),
      paddingHorizontal: ms(16),
      marginBottom: ms(10),
      alignItems: "center",
      justifyContent: "center",
      minHeight: ms(52),
    },
    starsBoxLine: {
      color: asl.text.primary,
      fontSize: ts(18),
      lineHeight: ts(24),
      fontWeight: "800",
      textAlign: "center",
    },
    starsBoxHint: {
      marginTop: ms(8),
      color: asl.text.muted,
      fontSize: ts(13),
    },
    starsBoxError: {
      borderColor: "rgba(248, 113, 113, 0.45)",
      backgroundColor: "rgba(248, 113, 113, 0.12)",
    },
    starsBoxErrorText: {
      color: "#FCA5A5",
      fontSize: ts(14),
      fontWeight: "600",
      textAlign: "center",
    },
    statsRow: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
      marginBottom: 12,
    },
    resetButton: {
      alignSelf: "flex-start",
      marginBottom: 12,
      backgroundColor: "rgba(248, 113, 113, 0.3)",
      paddingHorizontal: ms(12),
      paddingVertical: ms(8),
      borderRadius: 12,
    },
    resetButtonText: {
      color: "#FCA5A5",
      fontSize: ts(14),
      fontWeight: "700",
    },
    tipsSection: {
      marginTop: 8,
    },
  });
};