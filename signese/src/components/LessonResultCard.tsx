import { lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";
import { useLessonPalette, useTheme, type LessonPalette } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type LessonResultCardProps = {
  title: string;
  subtitle: string;
  stars: number;
};

export function LessonResultCard({ title, subtitle, stars }: LessonResultCardProps) {
  const lc = useLessonPalette();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(lc, theme, colors), [lc, theme, colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.starRow}>
        {Array.from({ length: 5 }).map((_, index) => {
          const filled = index < stars;
          return (
            <Text key={`star-${index}`} style={[styles.star, !filled && styles.starMuted]}>
              ★
            </Text>
          );
        })}
      </View>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const createStyles = (
  lc: LessonPalette,
  theme: "light" | "dark",
  colors: { border: string }
) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.lg,
      backgroundColor: lc.surface,
      padding: lessonSpacing.lg,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.14)",
      ...asl.shadow.card,
    },
    title: {
      ...lessonTypography.subtitle,
      color: lc.textPrimary,
      textAlign: "center",
      fontWeight: fontWeight.emphasis,
    },
    starRow: {
      flexDirection: "row",
      marginTop: lessonSpacing.md,
      marginBottom: lessonSpacing.sm,
      columnGap: 8,
    },
    star: {
      fontSize: 28,
      color: lc.star,
    },
    starMuted: {
      color: theme === "light" ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.28)",
    },
    subtitle: {
      ...lessonTypography.body,
      color: lc.textSecondary,
      textAlign: "center",
    },
  });
