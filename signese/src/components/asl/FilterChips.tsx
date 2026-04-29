import React from "react";
import { Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";

type Chip = { id: string; label: string };

type Props = {
  items: readonly Chip[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function FilterChips({ items, selectedIds, onToggle }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map((item) => {
        const on = selectedIds.includes(item.id);
        return (
          <Pressable
            key={item.id}
            onPress={() => onToggle(item.id)}
            style={({ pressed }) => [
              styles.chip,
              on && styles.chipOn,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingVertical: 4 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.2)"},
  chipOn: {
    backgroundColor: "rgba(244, 114, 182, 0.25)",
    borderColor: "rgba(244, 114, 182, 0.5)"},
  label: { color: asl.text.secondary, fontSize: 13, fontWeight: fontWeight.medium },
  labelOn: { color: asl.text.primary }});
