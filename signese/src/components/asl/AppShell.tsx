import { useTheme } from "@/src/contexts/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  children: React.ReactNode;
  header?: React.ReactNode;
  scroll?: boolean;
};

export function AppShell({ children, header }: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {header}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
});