import { lessonColors, lessonTypography } from "@/src/theme";
import React from "react";
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

const styles = StyleSheet.create({
  base: {
    width: 124,
    height: 52,
    borderRadius: 18,
    backgroundColor: lessonColors.answerButton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  selected: {
    borderColor: lessonColors.progressFill,
    backgroundColor: "#CBEFE9",
  },
  correct: {
    backgroundColor: "#DCF6E7",
    borderColor: lessonColors.success,
  },
  incorrect: {
    backgroundColor: "#FBE3E6",
    borderColor: lessonColors.error,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 0.82,
  },
  label: {
    ...lessonTypography.button,
    fontSize: 14,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
});
