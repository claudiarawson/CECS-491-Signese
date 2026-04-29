import { lessonColors, lessonSpacing, Radius } from "@/src/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type LessonProgressBarProps = {
  currentStep: number;
  totalSteps: number;
};

export function LessonProgressBar({ currentStep, totalSteps }: LessonProgressBarProps) {
  const safeTotal = Math.max(1, totalSteps);
  const progress = Math.max(0, Math.min(1, currentStep / safeTotal));

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.label}>{`Step ${currentStep}/${safeTotal}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: lessonSpacing.md,
  },
  track: {
    height: 8,
    borderRadius: Radius.lg,
    backgroundColor: lessonColors.progressBackground,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: Radius.lg,
    backgroundColor: lessonColors.progressFill,
  },
  label: {
    marginTop: lessonSpacing.xs,
    textAlign: "right",
    color: lessonColors.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
});
