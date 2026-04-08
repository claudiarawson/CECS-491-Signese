import {
  DailyTipsCarousel,
  HeaderActionButton,
  HeaderAvatarButton,
  ScreenContainer,
  ScreenHeader,
  SectionCard,
} from "@/src/components/layout";
import {
  getDeviceDensity,
  moderateScale,
  semanticColors,
  Sizes,
  Spacing,
  Typography,
} from "@/src/theme";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

export default function HomeScreen() {
  const { textScale } = useAccessibility();
  const { profile, loading } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const streakCount = profile?.streak?.current ?? 0;
  const stars = profile?.stars?.balance ?? 0;

  const streakCount = profile?.streak?.current ?? 0;

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  if (loading) {
    return (
      <ScreenContainer backgroundColor="#F1F6F5">
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Home"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings" as any)}
            />
            <HeaderAvatarButton
              avatar={profile?.avatar}
              onPress={() => router.push("/(tabs)/account")}
            />
          </>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.greetingWrap}>
          <Text style={styles.greetingLine}>Welcome Back</Text>
          <Text style={styles.greetingName}>
            {profile?.username ?? "User"}! 👋
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardStreak]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={styles.statValue}>{streakCount}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>

          <View style={[styles.statCard, styles.statCardStars]}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>{stars}</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>

          <View style={[styles.statCard, styles.statCardLessons]}>
            <Text style={styles.statIcon}>📖</Text>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
        </View>

        <SectionCard style={styles.learningCard}>
          <View style={styles.learningTopRow}>
            <View style={styles.learningIconWrap}>
              <Text style={styles.learningIcon}>👋</Text>
            </View>
            <View style={styles.learningTextWrap}>
              <Text style={styles.learningTitle}>Continue Learning</Text>
              <Text style={styles.learningSubtitle}>
                Greetings • 0% complete
              </Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Pressable
            style={styles.continueBtn}
            onPress={() => router.push("/(tabs)/learn")}
          >
            <Text style={styles.continueBtnText}>▶ Continue to Learn</Text>
          </Pressable>
        </SectionCard>

        <View style={styles.tipsSection}>
          <DailyTipsCarousel />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.lg,
    },
    greetingWrap: {
      marginBottom: ms(8),
    },
    greetingLine: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontSize: ts(16),
      lineHeight: ts(20),
    },
    greetingName: {
      ...Typography.screenTitle,
      color: semanticColors.text.primary,
      fontSize: ts(26),
      lineHeight: ts(30),
      textDecorationLine: "underline",
      fontWeight: "700",
    },
    statsRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      marginBottom: Spacing.cardGap,
    },
    statCard: {
      flex: 1,
      minHeight: Sizes.statCardHeight * density,
      borderRadius: ms(16),
      paddingVertical: ms(6),
      alignItems: "center",
      justifyContent: "center",
    },
    statCardStreak: {
      backgroundColor: "#F4D5D5",
    },
    statCardStars: {
      backgroundColor: "#F5ECCD",
    },
    statCardLessons: {
      backgroundColor: "#D2F1D8",
    },
    statIcon: {
      fontSize: ts(18),
      marginBottom: ms(2),
    },
    statValue: {
      ...Typography.statNumber,
      fontSize: ts(28),
      color: semanticColors.text.primary,
      lineHeight: ts(30),
    },
    statLabel: {
      ...Typography.caption,
      fontSize: ts(12),
      color: semanticColors.text.secondary,
      lineHeight: ts(14),
    },
    learningCard: {
      backgroundColor: "#EDEDED",
      padding: ms(9),
      marginBottom: Spacing.cardGap,
    },
    learningTopRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: ms(6),
      gap: ms(8),
    },
    learningIconWrap: {
      width: ms(46),
      height: ms(46),
      borderRadius: ms(14),
      backgroundColor: "#1FB590",
      alignItems: "center",
      justifyContent: "center",
    },
    learningIcon: {
      fontSize: ts(22),
    },
    learningTextWrap: {
      flex: 1,
    },
    learningTitle: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontWeight: "700",
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    learningSubtitle: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ts(13),
      lineHeight: ts(16),
    },
    progressTrack: {
      width: "100%",
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: "#D4D7D6",
      marginBottom: ms(10),
    },
    progressFill: {
      width: "8%",
      height: "100%",
      borderRadius: ms(3),
      backgroundColor: "#21BA95",
    },
    continueBtn: {
      height: Sizes.buttonHeight * density,
      borderRadius: Sizes.buttonRadius * density,
      backgroundColor: "#23B58F",
      alignItems: "center",
      justifyContent: "center",
    },
    continueBtnText: {
      ...Typography.button,
      color: "#FFFFFF",
      fontSize: ts(14),
      lineHeight: ts(18),
    },
    tipsSection: {
      marginTop: 0,
    },
    loadingWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.screenPadding,
    },
    loadingText: {
      marginTop: ms(10),
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ts(14),
      lineHeight: ts(18),
    },
  });
};