import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Search" }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: colors.border,
          backgroundColor: colors.controlWell,
        },
      ]}
    >
      <MaterialIcons name="search" size={22} color={colors.subtext} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        style={[styles.input, { color: colors.text }]}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityLabel="Clear search">
          <MaterialIcons name="close" size={20} color={colors.subtext} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
});
