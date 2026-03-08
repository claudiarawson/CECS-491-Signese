import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Sizes, Spacing, moderateScale } from "@/src/theme";

type SectionCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: Sizes.sectionCardRadius,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.cardGap,
    borderWidth: 1,
    borderColor: "#E5ECEA",
    shadowColor: "#000000",
    shadowOpacity: 0.03,
    shadowRadius: moderateScale(5),
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
});
