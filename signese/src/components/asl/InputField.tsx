import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type Props = TextInputProps & {
  label?: string;
  errorMessage?: string | null;
};

export function InputField({ label, errorMessage, style, ...rest }: Props) {
  return (
    <View style={styles.block}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={asl.text.muted}
        style={[styles.input, errorMessage && styles.inputError, style]}
        {...rest}
      />
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 14 },
  label: {
    color: asl.text.secondary,
    fontSize: 12,
    marginBottom: 6,
    fontFamily: fontFamily.medium,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.25)",
    color: asl.text.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: fontFamily.body,
  },
  inputError: { borderColor: "#F87171" },
  error: { color: "#FCA5A5", marginTop: 6, fontSize: 12, fontFamily: fontFamily.body },
});
