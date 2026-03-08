import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  getDeviceDensity,
  semanticColors,
  Typography,
  Spacing,
  Sizes,
  moderateScale,
} from "@/src/theme";
import { ScreenContainer } from "@/src/components/layout/Screen";
import { ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout/Header";
import { SectionCard } from "@/src/components/layout/SectionCard";

export default function HomeScreen() {
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density);
  return (
    <ScreenContainer backgroundColor="#F1F6F5" contentStyle={styles.content}>
      <ScreenHeader
        title="Home"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings")}
              density={density}
            />
            <HeaderAvatarButton avatar="🐨" onPress={() => router.push("/(tabs)/account")} density={density} />
          </>
        }
      />

      <View style={styles.greetingWrap}>
        <Text style={styles.greetingLine}>Welcome Back</Text>
        <Text style={styles.greetingName}>Matthew! 👋</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardStreak]}>
          <Text style={styles.statIcon}>🔥</Text>
          <Text style={styles.statValue}>1</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
        <View style={[styles.statCard, styles.statCardStars]}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statValue}>0</Text>
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
              <Text style={styles.learningSubtitle}>Greetings • 0% complete</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <Pressable style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>▶ Continue to Learn</Text>
          </Pressable>
      </SectionCard>

      <SectionCard style={styles.tipCard}>
          <View style={styles.tipHeaderRow}>
            <Text style={styles.tipTitle}>😊 Tip: Facial Expressions</Text>
            <View style={styles.tipNavWrap}>
              <Pressable style={styles.tipNavBtn}>
                <Text style={styles.tipNavText}>‹</Text>
              </Pressable>
              <Pressable style={styles.tipNavBtn}>
                <Text style={styles.tipNavText}>›</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.tipBody}>
            In ASL, facial expressions are just as important as hand movements!
          </Text>
          <View style={styles.dotRow}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
      </SectionCard>
    </ScreenContainer>
  );
}

const createStyles = (density: number) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
    content: {
      flex: 1,
      paddingBottom: Spacing.sm,
    },
    greetingWrap: {
      marginBottom: ms(8),
    },
    greetingLine: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontSize: ms(16),
      lineHeight: ms(20),
    },
    greetingName: {
      ...Typography.screenTitle,
      color: semanticColors.text.primary,
      fontSize: ms(26),
      lineHeight: ms(30),
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
      fontSize: ms(18),
      marginBottom: ms(2),
    },
    statValue: {
      ...Typography.statNumber,
      fontSize: ms(28),
      color: semanticColors.text.primary,
      lineHeight: ms(30),
    },
    statLabel: {
      ...Typography.caption,
      fontSize: ms(12),
      color: semanticColors.text.secondary,
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
      fontSize: ms(22),
    },
    learningTextWrap: {
      flex: 1,
    },
    learningTitle: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontWeight: "700",
      fontSize: ms(18),
      lineHeight: ms(22),
    },
    learningSubtitle: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ms(13),
      lineHeight: ms(16),
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
    },
    tipCard: {
      backgroundColor: "#F2E7BF",
      padding: ms(8),
      marginBottom: Spacing.xs,
    },
    tipHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: ms(4),
    },
    tipTitle: {
      ...Typography.sectionTitle,
      fontWeight: "700",
      color: semanticColors.text.primary,
      fontSize: ms(14),
      lineHeight: ms(18),
      flex: 1,
    },
    tipNavWrap: {
      flexDirection: "row",
      gap: ms(4),
    },
    tipNavBtn: {
      width: ms(22),
      height: ms(22),
      borderRadius: ms(11),
      backgroundColor: "#F8F8F8",
      alignItems: "center",
      justifyContent: "center",
    },
    tipNavText: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ms(13),
      lineHeight: ms(15),
    },
    tipBody: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ms(12),
      lineHeight: ms(16),
      marginBottom: ms(8),
    },
    dotRow: {
      flexDirection: "row",
      alignSelf: "center",
      gap: ms(4),
    },
    dot: {
      width: ms(6),
      height: ms(6),
      borderRadius: ms(3),
      backgroundColor: "#CFD3D1",
    },
    dotActive: {
      width: ms(12),
      backgroundColor: "#23B58F",
    },
  });
};