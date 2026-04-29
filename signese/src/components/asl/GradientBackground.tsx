import React from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { asl } from "@/src/theme/aslConnectTheme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  extraBottom?: number;
  variant?: "default" | "welcome";
};

export function GradientBackground({
  children,
  style,
  extraBottom = 0,
  variant = "default",
}: Props) {
  const colors =
    variant === "welcome"
      ? ([...asl.welcome] as const)
      : ([...asl.gradient] as const);
  return (
    <LinearGradient
      colors={colors as unknown as readonly [string, string, ...string[]]}
      locations={variant === "welcome" ? [0, 0.32, 0.7, 1] : [0, 0.35, 0.7, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={[styles.root, { paddingBottom: extraBottom }, style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
