import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { semanticColors, Spacing, Typography, fontFamily } from "@/src/theme";

type Props = {
  title: string;
  description?: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.wrap} accessibilityRole="text">
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
  },
  title: {
    ...Typography.sectionTitle,
    fontFamily: fontFamily.heading,
    color: semanticColors.text.primary,
    textAlign: "center",
  },
  description: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
});
