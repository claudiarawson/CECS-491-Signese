import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";

type PrimaryActionButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryActionButton({
  label,
  onPress,
  disabled = false,
  style}: PrimaryActionButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.press,
        style,
        (pressed || disabled) && styles.dimmed,
      ]}
    >
      <LinearGradient
        colors={[...asl.primaryButton] as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <Text style={styles.label}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    borderRadius: 999,
    overflow: "hidden",
    minHeight: 52,
    width: "100%",
    maxWidth: 288},
  fill: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20},
  dimmed: {
    opacity: 0.55},
  label: {
    fontWeight: fontWeight.emphasis,
    fontSize: 16,
    color: asl.surfaceLight}});
