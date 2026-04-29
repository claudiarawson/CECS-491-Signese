import React from "react";
import { Text, View, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type Props = {
  icon: string;
  value: string | number;
  label: string;
  accent?: "pink" | "cyan" | "warm";
  style?: ViewStyle;
  valueStyle?: TextStyle;
};

const accentMap = {
  pink: "rgba(244, 114, 182, 0.2)",
  cyan: "rgba(56, 189, 248, 0.2)",
  warm: "rgba(251, 191, 36, 0.2)",
} as const;

export function StatCard({ icon, value, label, accent = "pink", style, valueStyle }: Props) {
  return (
    <View style={[styles.card, { backgroundColor: accentMap[accent] }, asl.shadow.card, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, valueStyle]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: asl.radius.md,
    borderWidth: 1,
    borderColor: asl.glass.border,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
  },
  icon: { fontSize: 20, marginBottom: 4, fontFamily: fontFamily.body },
  value: { color: asl.text.primary, fontSize: 26, fontFamily: fontFamily.heading },
  label: { color: asl.text.secondary, fontSize: 12, fontFamily: fontFamily.medium },
});
