import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type LessonResultCardProps = {
  title: string;
  subtitle: string;
  stars: number;
};

export function LessonResultCard({ title, subtitle, stars }: LessonResultCardProps) {
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

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    backgroundColor: lessonColors.surface,
    padding: lessonSpacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    ...lessonTypography.subtitle,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
  starRow: {
    flexDirection: "row",
    marginTop: lessonSpacing.md,
    marginBottom: lessonSpacing.sm,
    columnGap: 8,
  },
  star: {
    fontSize: 28,
    color: lessonColors.star,
  },
  starMuted: {
    color: "#DBE2E8",
  },
  subtitle: {
    ...lessonTypography.body,
    color: lessonColors.textSecondary,
    textAlign: "center",
  },
});
