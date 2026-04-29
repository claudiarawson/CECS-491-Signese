import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

type Chip = { id: string; label: string };

type Props = {
  items: readonly Chip[];
  selectedIds: string[];
  onToggle: (id: string) => void;
};

export function FilterChips({ items, selectedIds, onToggle }: Props) {
  const { colors, theme } = useTheme();
  const chipOnBorder = theme === "light" ? `${colors.primary}99` : "rgba(244, 114, 182, 0.5)";
  const chipOnBg = theme === "light" ? "rgba(219, 39, 119, 0.18)" : "rgba(244, 114, 182, 0.25)";

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
              {
                borderColor: colors.border,
                backgroundColor: colors.controlWell,
              },
              on && {
                backgroundColor: chipOnBg,
                borderColor: chipOnBorder,
              },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.label, { color: colors.subtext }, on && { color: colors.text, fontWeight: "700" }]}>
              {item.label}
            </Text>
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
  },
  label: { fontSize: 13, fontWeight: fontWeight.medium },
});
