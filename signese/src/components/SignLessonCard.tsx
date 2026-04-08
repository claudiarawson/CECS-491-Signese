import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import React from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

type SignLessonCardProps = {
  gif?: ImageSourcePropType;
  label?: string;
  instruction?: string;
};

export function SignLessonCard({ gif, label, instruction }: SignLessonCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.mediaWrap}>
        {gif ? (
          <Image source={gif} style={styles.media} resizeMode="contain" />
        ) : (
          <Text style={styles.fallbackText}>Sign preview coming soon</Text>
        )}
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {instruction ? <Text style={styles.instruction}>{instruction}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: lessonColors.surface,
    borderRadius: Radius.lg,
    padding: lessonSpacing.lg,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 300,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  mediaWrap: {
    width: "100%",
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lessonSpacing.md,
  },
  media: {
    width: "88%",
    height: "88%",
  },
  fallbackText: {
    ...lessonTypography.caption,
    color: lessonColors.textSecondary,
  },
  label: {
    ...lessonTypography.subtitle,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
  instruction: {
    ...lessonTypography.body,
    color: lessonColors.textSecondary,
    textAlign: "center",
    marginTop: lessonSpacing.sm,
  },
});
