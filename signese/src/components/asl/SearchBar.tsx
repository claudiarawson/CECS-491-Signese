import React from "react";
import { TextInput, View, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export function SearchBar({ value, onChangeText, placeholder = "Search" }: Props) {
  return (
    <View style={styles.wrap}>
      <MaterialIcons name="search" size={22} color={asl.text.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={asl.text.muted}
        style={styles.input}
      />
      {value.length > 0 ? (
        <Pressable onPress={() => onChangeText("")} hitSlop={8} accessibilityLabel="Clear search">
          <MaterialIcons name="close" size={20} color={asl.text.muted} />
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
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    minHeight: 48},
  input: {
    flex: 1,
    marginLeft: 8,
    color: asl.text.primary,
    fontSize: 16}});
