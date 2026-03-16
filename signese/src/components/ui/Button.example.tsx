/**
 * Example: Reusable Button Component
 * 
 * This demonstrates how to create standardized components using the design system.
 * Use this pattern for other UI components like Input, Card, etc.
 */

import React from "react";
import { Pressable, Text, ViewStyle, TextStyle, StyleProp } from "react-native";
import { typography, componentStyles, semanticColors } from "@/src/theme";

type ButtonVariant = "primary" | "secondary";

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function AppButton({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  textStyle,
}: AppButtonProps) {
  const buttonStyle =
    variant === "primary"
      ? componentStyles.buttonPrimary
      : componentStyles.buttonSecondary;

  const textPreset =
    variant === "primary"
      ? typography.buttonPrimary
      : typography.buttonSecondary;

  const textColor =
    variant === "primary"
      ? semanticColors.button.primaryText
      : semanticColors.button.secondaryText;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        buttonStyle,
        style,
        pressed && { opacity: 0.8 },
        disabled && { opacity: 0.5 },
      ]}
    >
      <Text style={[textPreset, { color: textColor }, textStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

/**
 * Usage Examples:
 * 
 * // Primary button
 * <AppButton 
 *   title="Sign In" 
 *   onPress={handleSignIn}
 * />
 * 
 * // Secondary button
 * <AppButton 
 *   title="Sign Up" 
 *   onPress={handleSignUp}
 *   variant="secondary"
 * />
 * 
 * // Disabled button
 * <AppButton 
 *   title="Submit" 
 *   onPress={handleSubmit}
 *   disabled={!isFormValid}
 * />
 * 
 * // Custom styling
 * <AppButton 
 *   title="Custom" 
 *   onPress={handlePress}
 *   style={{ width: '80%' }}
 *   textStyle={{ fontSize: moderateScale(14) }}
 * />
 */
