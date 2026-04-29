import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import React from "react";
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";

type Props = {
  icon: string;
  value: string | number;
  label: string;
  accent?: "pink" | "cyan" | "warm" | "glass";
  style?: ViewStyle;
  valueStyle?: TextStyle;
};

export function StatCard({
  icon,
  value,
  label,
  accent = "pink",
  style,
  valueStyle,
}: Props) {
  const { colors, theme } = useTheme();

  const accentStyle =
    accent === "pink"
      ? {
          backgroundColor: theme === "dark" ? "rgba(244, 114, 182, 0.12)" : colors.card,
          borderColor: theme === "dark" ? "rgba(244, 114, 182, 0.22)" : colors.border,
        }
      : accent === "cyan"
        ? {
            backgroundColor: theme === "dark" ? "rgba(56, 189, 248, 0.12)" : colors.card,
            borderColor: theme === "dark" ? "rgba(56, 189, 248, 0.22)" : colors.border,
          }
        : accent === "warm"
          ? {
              backgroundColor: theme === "dark" ? "rgba(251, 191, 36, 0.12)" : colors.card,
              borderColor: theme === "dark" ? "rgba(251, 191, 36, 0.22)" : colors.border,
            }
          : {
              backgroundColor: colors.card,
              borderColor: colors.border,
            };

  return (
    <View style={[styles.card, accentStyle, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: colors.text }, valueStyle]}>{value}</Text>
      <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
  },

  icon: {
    fontSize: 20,
    marginBottom: 4,
  },

  value: {
    fontSize: 26,
    fontWeight: fontWeight.emphasis,
  },

  label: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },
});