import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";
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
      {label ? (
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      ) : null}
      {instruction ? (
        <Text style={styles.instruction} numberOfLines={4}>
          {instruction}
        </Text>
      ) : null}
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    ...asl.shadow.card,
  },
  mediaWrap: {
    width: "100%",
    height: 180,
    borderRadius: Radius.md,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: lessonSpacing.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  media: {
    width: "88%",
    height: "88%",
  },
  fallbackText: {
    ...lessonTypography.caption,
    color: lessonColors.textSecondary,
    fontFamily: fontFamily.body,
  },
  label: {
    ...lessonTypography.subtitle,
    color: lessonColors.textPrimary,
    textAlign: "center",
    fontFamily: fontFamily.heading,
  },
  instruction: {
    ...lessonTypography.body,
    color: lessonColors.textSecondary,
    textAlign: "center",
    marginTop: lessonSpacing.sm,
    fontFamily: fontFamily.body,
  },
});
