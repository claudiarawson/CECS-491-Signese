import { lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";
import { useLessonPalette, useTheme, type LessonPalette, type ThemeColors } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";

type SignLessonCardProps = {
  gif?: ImageSourcePropType;
  label?: string;
  instruction?: string;
};

export function SignLessonCard({ gif, label, instruction }: SignLessonCardProps) {
  const lc = useLessonPalette();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(lc, theme, colors), [lc, theme, colors]);

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

const createStyles = (lc: LessonPalette, theme: "light" | "dark", colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: lc.surface,
      borderRadius: Radius.lg,
      padding: lessonSpacing.lg,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 300,
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.14)",
      ...asl.shadow.card,
    },
    mediaWrap: {
      width: "100%",
      height: 180,
      borderRadius: Radius.md,
      backgroundColor: theme === "light" ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: lessonSpacing.md,
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.08)",
      overflow: "hidden",
    },
    media: {
      width: "88%",
      height: "88%",
    },
    fallbackText: {
      ...lessonTypography.caption,
      color: lc.textSecondary,
    },
    label: {
      ...lessonTypography.subtitle,
      color: lc.textPrimary,
      textAlign: "center",
      fontWeight: fontWeight.emphasis,
    },
    instruction: {
      ...lessonTypography.body,
      color: lc.textSecondary,
      textAlign: "center",
      marginTop: lessonSpacing.sm,
    },
  });
