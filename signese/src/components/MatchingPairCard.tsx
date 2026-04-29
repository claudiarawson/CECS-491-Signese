import { lessonColors, lessonTypography, Radius } from "@/src/theme";
import { fontWeight } from "@/src/theme";
import React from "react";
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
  onPress}: MatchingPairCardProps) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: lessonColors.surface,
    borderRadius: Radius.lg,
    minHeight: 60,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)"},
  selected: {
    borderColor: "rgba(34, 211, 238, 0.55)",
    backgroundColor: "rgba(34, 211, 238, 0.14)"},
  matched: {
    borderColor: lessonColors.success,
    backgroundColor: "rgba(74, 222, 128, 0.14)",
    opacity: 0.92},
  pressed: {
    opacity: 0.92},
  label: {
    ...lessonTypography.body,
    color: lessonColors.textPrimary,
    textAlign: "center"}});
