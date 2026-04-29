import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
  description?: string;
};

export function ToggleSwitch({ value, onValueChange, label, description }: Props) {
  const { colors, theme } = useTheme();
  const trackOff = theme === "light" ? "rgba(15,23,42,0.12)" : "rgba(255,255,255,0.2)";
  const trackOn = theme === "light" ? "rgba(219, 39, 119, 0.35)" : "rgba(244, 114, 182, 0.5)";

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.textCol}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description ? (
          <Text style={[styles.desc, { color: colors.subtext }]}>{description}</Text>
        ) : null}
      </View>
      <View style={[styles.track, { backgroundColor: value ? trackOn : trackOff }]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  textCol: { flex: 1 },
  label: { fontSize: 15, fontWeight: fontWeight.medium },
  desc: { fontSize: 12, marginTop: 2 },
  track: {
    width: 48,
    height: 28,
    borderRadius: 16,
    padding: 2,
    justifyContent: "center",
  },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignSelf: "flex-start",
  },
  knobOn: { alignSelf: "flex-end" },
});
