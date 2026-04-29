import { lessonColors, lessonTypography } from "@/src/theme";
import { fontWeight } from "@/src/theme";
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
  disabled = false}: QuizAnswerButtonProps) {
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
    width: 138,
    minHeight: 60,
    borderRadius: 20,
    backgroundColor: lessonColors.answerButton,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"},
  selected: {
    borderColor: "rgba(34, 211, 238, 0.65)",
    backgroundColor: "rgba(34, 211, 238, 0.15)"},
  correct: {
    backgroundColor: "rgba(74, 222, 128, 0.2)",
    borderColor: lessonColors.success},
  incorrect: {
    backgroundColor: "rgba(248, 113, 113, 0.18)",
    borderColor: lessonColors.error},
  pressed: {
    opacity: 0.88},
  disabled: {
    opacity: 0.82},
  label: {
    ...lessonTypography.button,
    color: lessonColors.textPrimary,
    textAlign: "center",
    fontWeight: fontWeight.medium}});
