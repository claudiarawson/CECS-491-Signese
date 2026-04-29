import { lessonColors, lessonSpacing, lessonTypography } from "@/src/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type LessonHeaderProps = {
  title: string;
  subtitle?: string;
};

export function LessonHeader({ title, subtitle }: LessonHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: lessonSpacing.sm,
  },
  title: {
    ...lessonTypography.title,
    fontSize: 22,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...lessonTypography.caption,
    fontSize: 11,
    color: lessonColors.textSecondary,
    marginTop: lessonSpacing.xs,
    textAlign: "center",
  },
});
