import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, useWindowDimensions, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import { lessonColors } from "@/src/theme/colors";
import {
  fontWeight,
  getDeviceDensity,
  moderateScale,
  Spacing} from "@/src/theme";
import { ALPHABET_LEARN_ITEMS } from "@/src/features/learn/data/alphabet";
import { setLessonStepProgress } from "@/src/features/learn/utils/lessonProgress";

export default function AlphabetLearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const styles = useMemo(() => createStyles(ms), [ms]);

  const currentItem = ALPHABET_LEARN_ITEMS[currentIndex];
  React.useEffect(() => {
    void setLessonStepProgress("alphabet", 0);
  }, []);

  const total = ALPHABET_LEARN_ITEMS.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    void setLessonStepProgress("alphabet", 1);
    router.push("/learn/alphabet/type");
  };

  const headerRight = (
    <>
      <Pressable
        onPress={() => router.push("/(tabs)/settings" as any)}
        hitSlop={8}
        accessibilityLabel="Open settings"
        style={styles.headerIcon}
      >
        <MaterialIcons name="settings" size={24} color={asl.text.secondary} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/(tabs)/account")}
        hitSlop={8}
        accessibilityLabel="Open profile"
        style={styles.headerIcon}
      >
        <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
      </Pressable>
    </>
  );

  return (
    <AppShell
      scroll={false}
      header={
        <LearnFlowHeader
          title="Alphabet"
          onBackPress={() => router.replace("/(tabs)/learn")}
          rightExtra={headerRight}
        />
      }
    >
      <View style={styles.inner}>
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressLabel}>Learn</Text>
            <Text style={styles.progressCount}>
              {currentIndex + 1}/{total}
            </Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>

          <View style={styles.card}>
            <View style={styles.imageFrame}>
              <Image source={currentItem.image} style={styles.lessonImage} resizeMode="contain" />
            </View>

            <Text style={styles.subtitle}>Watch and learn this sign</Text>
            <Text style={styles.letterText}>{currentItem.letter}</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton label={currentIndex === total - 1 ? "Finish" : "Next"} onPress={handleNext} />
        </View>
      </View>
    </AppShell>
  );
}

const createStyles = (ms: (n: number) => number) =>
  StyleSheet.create({
    headerIcon: {
      padding: ms(4)},
    inner: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding},
    scrollInner: {
      flexGrow: 1,
      paddingBottom: ms(16)},
    progressTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: ms(4)},
    progressLabel: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: asl.text.secondary},
    progressCount: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: asl.text.secondary},
    progressTrack: {
      height: ms(8),
      borderRadius: ms(99),
      backgroundColor: lessonColors.progressBackground,
      marginTop: ms(10),
      overflow: "hidden"},
    progressFill: {
      height: "100%",
      backgroundColor: lessonColors.progressFill,
      borderRadius: ms(99)},
    card: {
      marginTop: ms(16),
      backgroundColor: asl.glass.bg,
      borderRadius: ms(22),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      paddingHorizontal: ms(16),
      paddingVertical: ms(16),
      alignItems: "center",
      justifyContent: "center",
      ...asl.shadow.card},
    lessonImage: {
      width: "100%",
      height: "100%"},
    imageFrame: {
      width: "100%",
      maxWidth: ms(260),
      height: ms(260),
      marginBottom: ms(12),
      borderRadius: ms(18),
      backgroundColor: "rgba(0,0,0,0.35)",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      padding: ms(8)},
    subtitle: {
      fontSize: ms(13),
      fontWeight: fontWeight.medium,
      color: asl.text.muted,
      textAlign: "center"},
    letterText: {
      marginTop: ms(6),
      fontSize: ms(26),
      fontWeight: fontWeight.emphasis,
      color: asl.text.primary,
      textAlign: "center"},
    footer: {
      flexShrink: 0,
      paddingBottom: ms(12),
      paddingTop: ms(8),
      alignItems: "center"}});
