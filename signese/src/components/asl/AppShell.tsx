import { useTheme } from "@/src/contexts/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
};

export function AppShell({ children, header, scroll = true }: Props) {
  const { colors } = useTheme();

  if (!scroll) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {header}
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});