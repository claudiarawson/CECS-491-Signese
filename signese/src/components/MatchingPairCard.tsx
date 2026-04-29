import { lessonColors, lessonTypography, Radius } from "@/src/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
      <View>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: lessonColors.surface,
    borderRadius: Radius.lg,
    minHeight: 52,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DFE5EA",
  },
  selected: {
    borderColor: lessonColors.progressFill,
    backgroundColor: "#E8F8F5",
  },
  matched: {
    borderColor: lessonColors.success,
    backgroundColor: "#EAF9F0",
    opacity: 0.86,
  },
  pressed: {
    opacity: 0.9,
  },
  label: {
    ...lessonTypography.body,
    fontSize: 13,
    color: lessonColors.textPrimary,
    textAlign: "center",
  },
});
