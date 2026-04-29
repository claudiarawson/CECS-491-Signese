import { lessonSpacing, lessonTypography } from "@/src/theme";
import { useLessonPalette, type LessonPalette } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type LessonHeaderProps = {
  title: string;
  subtitle?: string;
};

export function LessonHeader({ title, subtitle }: LessonHeaderProps) {
  const lc = useLessonPalette();
  const styles = useMemo(() => createStyles(lc), [lc]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const createStyles = (lc: LessonPalette) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      marginBottom: lessonSpacing.sm,
    },
    title: {
      ...lessonTypography.title,
      fontSize: 22,
      color: lc.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      ...lessonTypography.caption,
      fontSize: 11,
      color: lc.textSecondary,
      marginTop: lessonSpacing.xs,
      textAlign: "center",
    },
  });
