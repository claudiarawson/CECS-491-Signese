import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import React from "react";
import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

type TypingAnswerInputProps = TextInputProps;

export function TypingAnswerInput(props: TypingAnswerInputProps) {
  return (
    <View style={styles.wrap}>
      <TextInput
        placeholderTextColor={lessonColors.textSecondary}
        {...props}
        style={[styles.input, props.style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
  },
  input: {
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: lessonColors.surface,
    borderWidth: 1,
    borderColor: "#DCE3E9",
    paddingHorizontal: lessonSpacing.md,
    ...lessonTypography.body,
    color: lessonColors.textPrimary,
  },
});
