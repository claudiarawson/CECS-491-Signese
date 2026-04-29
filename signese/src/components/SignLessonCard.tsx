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
    paddingVertical: lessonSpacing.sm,
    paddingHorizontal: lessonSpacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 210,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  mediaWrap: {
    width: "100%",
    height: 116,
    borderRadius: Radius.md,
    backgroundColor: "#F7FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lessonSpacing.sm,
  },
  media: {
    width: "74%",
    height: "74%",
  },
  fallbackText: {
    ...lessonTypography.caption,
    color: lessonColors.textSecondary,
  },
  label: {
    ...lessonTypography.subtitle,
    fontSize: 13,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
  instruction: {
    ...lessonTypography.body,
    fontSize: 11,
    color: lessonColors.textSecondary,
    textAlign: "center",
    marginTop: lessonSpacing.sm,
  },
});
