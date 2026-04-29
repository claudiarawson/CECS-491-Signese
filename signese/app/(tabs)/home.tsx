import {
  AppShell,
  AslTabHeader,
  GradientBackground,
  ProgressCard,
  StatCard,
} from "@/src/components/asl";
import { DailyTipsCarousel } from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  getCompletedLessons,
  getLessonProgressPercent,
  getTotalStars,
  resetLessonProgress,
} from "@/src/features/learn/utils/lessonProgress";
import { fontWeight, getDeviceDensity, moderateScale, Spacing } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { useFocusEffect } from "@react-navigation/native";
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
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const { textScale } = useAccessibility();
  const { colors } = useTheme();
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
  const styles = useMemo(
    () => createStyles(density, textScale, colors),
    [density, textScale, colors]
  );

  const starCount = authUser ? (profile?.stars?.lifetimeEarned ?? 0) : guestStarTotal;

  if (loading) {
    return (
      <GradientBackground variant="default" style={{ flex: 1 }}>
        <SafeAreaView style={styles.loadingSafe} edges={["top", "left", "right"]}>
          <View style={styles.loadingOuter}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <AppShell
      header={
        <AslTabHeader
          title="Home"
          onSettings={() => router.push("/(tabs)/settings" as any)}
        />
      }
    >
      <View style={styles.screenContent}>
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingLine}>Welcome back</Text>
          <Text style={styles.greetingName}>{profile?.username ?? "learner"}</Text>
        </View>

        {statsError ? (
          <View style={styles.statsErrorBanner} accessibilityRole="alert">
            <Text style={styles.statsErrorBannerText}>{statsError}</Text>
          </View>
        ) : null}

        {statsLoading ? (
          <View style={styles.statsRow}>
            <View style={styles.statSkeleton}>
              <ActivityIndicator color={colors.accentBlue} />
            </View>
            <View style={styles.statSkeleton}>
              <ActivityIndicator color={colors.accentBlue} />
            </View>
            <View style={styles.statSkeleton}>
              <ActivityIndicator color={colors.accentBlue} />
            </View>
          </View>
        ) : (
          <View style={styles.statsRow}>
            <StatCard icon="⭐️" value={starCount} label="Stars" accent="pink" />
            <StatCard icon="🔥" value={streakCount} label="Streak" accent="warm" />
            <StatCard icon="📖" value={completedLessonsCount} label="Lessons" accent="cyan" />
          </View>
        )}

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
      </View>
    </AppShell>
  );
}

const createStyles = (density: number, textScale: number, colors: any) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    screenContent: {
      flex: 1,
    },

    loadingSafe: {
      flex: 1,
    },
    loadingOuter: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.screenPadding,
    },

    loadingText: {
      marginTop: ms(10),
      color: colors.subtext,
      fontSize: ts(14),
    },

    greetingWrap: {
      marginBottom: ms(14),
    },

    greetingLine: {
      color: colors.subtext,
      fontSize: ts(15),
      fontWeight: fontWeight.medium,
    },

    greetingName: {
      color: colors.text,
      fontSize: ts(26),
      fontWeight: fontWeight.emphasis,
    },

    statsErrorBanner: {
      marginBottom: ms(10),
      paddingVertical: ms(10),
      paddingHorizontal: ms(14),
      borderRadius: ms(14),
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.35)",
      backgroundColor: "rgba(248, 113, 113, 0.12)",
    },

    statsErrorBannerText: {
      color: "#FCA5A5",
      fontSize: ts(13),
      fontWeight: fontWeight.medium,
      textAlign: "center",
    },

    statsRow: {
      flexDirection: "row",
      gap: ms(10),
      marginBottom: ms(14),
      alignItems: "stretch",
    },

    statSkeleton: {
      flex: 1,
      minHeight: 96,
      borderRadius: asl.radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: "center",
      justifyContent: "center",
      ...asl.shadow.card,
    },

    resetButton: {
      alignSelf: "flex-start",
      marginBottom: ms(14),
      backgroundColor: colors.card,
      paddingHorizontal: ms(12),
      paddingVertical: ms(8),
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.border,
    },

    resetButtonText: {
      color: colors.text,
      fontSize: ts(13),
      fontWeight: fontWeight.medium,
    },

    tipsSection: {
      marginTop: ms(12),
    },
  });
};