import { lessonSpacing, lessonTypography, Radius } from "@/src/theme";import { useLessonPalette, useTheme, type LessonPalette } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

type TypingAnswerInputProps = TextInputProps;

export function TypingAnswerInput(props: TypingAnswerInputProps) {
  const lc = useLessonPalette();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(lc, theme, colors), [lc, theme, colors]);

  const placeholderColor =
    theme === "light" ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.45)";

  return (
    <TextInput
      placeholderTextColor={placeholderColor}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const createStyles = (
  lc: LessonPalette,
  theme: "light" | "dark",
  colors: { border: string; controlWell: string }
) =>
  StyleSheet.create({
    input: {
      height: 56,
      borderRadius: Radius.lg,
      backgroundColor: theme === "light" ? colors.controlWell : "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.16)",
      paddingHorizontal: lessonSpacing.md,
      ...lessonTypography.body,
      color: lc.textPrimary,
    },
  });
