import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { fontWeight } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  label: string;
  description?: string;
};

export function ToggleSwitch({ value, onValueChange, label, description }: Props) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.desc}>{description}</Text> : null}
      </View>
      <View style={[styles.track, value && styles.trackOn]}>
        <View style={[styles.knob, value && styles.knobOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  textCol: { flex: 1 },
  label: { color: asl.text.primary, fontSize: 15, fontWeight: fontWeight.medium },
  desc: { color: asl.text.muted, fontSize: 12, marginTop: 2},
  track: {
    width: 48,
    height: 28,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 2,
    justifyContent: "center"},
  trackOn: { backgroundColor: "rgba(244, 114, 182, 0.5)" },
  knob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignSelf: "flex-start"},
  knobOn: { alignSelf: "flex-end" }});
