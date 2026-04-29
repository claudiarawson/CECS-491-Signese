import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import { fontWeight } from "@/src/theme";
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

type TypingAnswerInputProps = TextInputProps;

export function TypingAnswerInput(props: TypingAnswerInputProps) {
  return (
    <TextInput
      placeholderTextColor="rgba(255,255,255,0.45)"
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    paddingHorizontal: lessonSpacing.md,
    ...lessonTypography.body,
    color: lessonColors.textPrimary}});
