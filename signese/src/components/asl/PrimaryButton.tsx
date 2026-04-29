import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";

type Props = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, style, textStyle, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.press, style, (pressed || disabled) && styles.dimmed]}
    >
      <LinearGradient
        colors={asl.primaryButton as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        <Text style={[styles.text, textStyle]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: {
    borderRadius: 999,
    overflow: "hidden",
    minHeight: 48},
  fill: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center"},
  text: {
    color: asl.text.primary,
    fontSize: 16,
    letterSpacing: 0.3,
    fontWeight: fontWeight.emphasis},
  dimmed: { opacity: 0.6 }});
