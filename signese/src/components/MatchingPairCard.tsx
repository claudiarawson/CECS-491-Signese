import { lessonTypography, Radius } from "@/src/theme";
import { fontWeight } from "@/src/theme";
import { useLessonPalette, useTheme, type LessonPalette } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type MatchingPairCardProps = {
  label: string;
  isSelected?: boolean;
  isMatched?: boolean;
  onPress: () => void;
};

export function MatchingPairCard({
  label,
  isSelected = false,
  isMatched = false,
  onPress,
}: MatchingPairCardProps) {
  const lc = useLessonPalette();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(lc, theme, colors), [lc, theme, colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={isMatched}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selected,
        isMatched && styles.matched,
        pressed && !isMatched && styles.pressed,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (
  lc: LessonPalette,
  theme: "light" | "dark",
  colors: { border: string }
) =>
  StyleSheet.create({
    card: {
      backgroundColor: lc.surface,
      borderRadius: Radius.lg,
      minHeight: 52,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.14)",
    },
    selected: {
      borderColor: "rgba(34, 211, 238, 0.55)",
      backgroundColor: "rgba(34, 211, 238, 0.14)",
    },
    matched: {
      borderColor: lc.success,
      backgroundColor: "rgba(74, 222, 128, 0.14)",
      opacity: 0.92,
    },
    pressed: {
      opacity: 0.92,
    },
    label: {
      ...lessonTypography.body,
      fontSize: 13,
      color: lc.textPrimary,
      textAlign: "center",
    },
  });
