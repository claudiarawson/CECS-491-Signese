import React from "react";
import {
  ScrollView,
  StyleSheet,
  type ScrollViewProps,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { GradientBackground } from "./GradientBackground";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
  variant?: "default" | "welcome";
  scroll?: boolean;
  scrollViewProps?: ScrollViewProps;
};

export function AppShell({ children, header, variant = "default", scroll = true, scrollViewProps }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <GradientBackground
      variant={variant}
      style={{ paddingTop: insets.top }}
    >
      <SafeAreaView style={styles.fill} edges={["left", "right", "bottom"]}>
        {header}
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: 100 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            {...scrollViewProps}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
  },
});
