import { Spacing } from "@/src/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GradientBackground } from "./GradientBackground";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
  /** Passed through to {@link GradientBackground} */
  variant?: "default" | "welcome";
};

/** Bottom omitted so floating tab bar + dictionary footer offsets stay accurate. */
const SAFE_EDGES = ["top", "left", "right"] as const;

export function AppShell({ children, header, variant = "default" }: Props) {
  return (
    <GradientBackground variant={variant} style={styles.container}>
      <SafeAreaView style={styles.safe} edges={SAFE_EDGES}>
        {header}
        <View style={styles.content}>{children}</View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
});