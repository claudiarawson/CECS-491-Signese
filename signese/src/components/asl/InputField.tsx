import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import React from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";

type Props = TextInputProps & {
  label?: string;
  errorMessage?: string | null;
};

export function InputField({ label, errorMessage, style, ...rest }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.block}>
      {label ? (
        <Text style={[styles.label, { color: colors.subtext }]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.subtext}
        style={[
          styles.input,
          {
            borderColor: colors.border,
            backgroundColor: colors.controlWell,
            color: colors.text,
          },
          errorMessage && styles.inputError,
          style,
        ]}
        {...rest}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 14 },
  label: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: fontWeight.medium,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: { borderColor: "#F87171" },
  error: { color: "#DC2626", marginTop: 6, fontSize: 12 },
});
