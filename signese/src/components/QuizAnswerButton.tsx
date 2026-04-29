import { lessonTypography } from "@/src/theme";
import { fontWeight } from "@/src/theme";
import { useLessonPalette, useTheme, type LessonPalette } from "@/src/contexts/ThemeContext";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

type QuizState = "default" | "selected" | "correct" | "incorrect";

type QuizAnswerButtonProps = {
  label: string;
  state?: QuizState;
  onPress: () => void;
  disabled?: boolean;
};

export function QuizAnswerButton({
  label,
  state = "default",
  onPress,
  disabled = false,
}: QuizAnswerButtonProps) {
  const lc = useLessonPalette();
  const { theme, colors } = useTheme();
  const styles = useMemo(() => createStyles(lc, theme, colors), [lc, theme, colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        state === "selected" && styles.selected,
        state === "correct" && styles.correct,
        state === "incorrect" && styles.incorrect,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
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
    base: {
      width: 138,
      minHeight: 60,
      borderRadius: 20,
      backgroundColor: lc.answerButton,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: theme === "light" ? colors.border : "rgba(255,255,255,0.14)",
    },
    selected: {
      borderColor: "rgba(34, 211, 238, 0.65)",
      backgroundColor: "rgba(34, 211, 238, 0.15)",
    },
    correct: {
      backgroundColor: "rgba(74, 222, 128, 0.2)",
      borderColor: lc.success,
    },
    incorrect: {
      backgroundColor: "rgba(248, 113, 113, 0.18)",
      borderColor: lc.error,
    },
    pressed: {
      opacity: 0.88,
    },
    disabled: {
      opacity: 0.82,
    },
    label: {
      ...lessonTypography.button,
      color: lc.textPrimary,
      textAlign: "center",
      fontWeight: fontWeight.medium,
    },
  });
