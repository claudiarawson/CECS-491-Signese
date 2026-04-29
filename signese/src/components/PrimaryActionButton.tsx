import { lessonColors, lessonTypography } from "@/src/theme";
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type PrimaryActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryActionButton({
  label,
  onPress,
  disabled = false,
  style,
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        style,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 46,
    borderRadius: 18,
    backgroundColor: lessonColors.primaryButton,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: 260,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    ...lessonTypography.button,
    fontSize: 14,
    color: lessonColors.textPrimary,
    fontWeight: "700",
  },
});
