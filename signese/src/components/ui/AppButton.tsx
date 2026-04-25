import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { componentStyles, semanticColors, typography } from "@/src/theme";

type ButtonVariant = "primary" | "secondary";

export type AppButtonProps = {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
}: AppButtonProps) {
  const buttonStyle =
    variant === "primary" ? componentStyles.buttonPrimary : componentStyles.buttonSecondary;
  const textPreset =
    variant === "primary" ? typography.buttonPrimary : typography.buttonSecondary;
  const textColor =
    variant === "primary"
      ? semanticColors.button.primaryText
      : semanticColors.button.secondaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        buttonStyle,
        styles.inner,
        style,
        pressed && !disabled && !loading && { opacity: 0.88 },
        (disabled || loading) && styles.muted,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[textPreset, { color: textColor }, textStyle]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  muted: {
    opacity: 0.55,
  },
});
