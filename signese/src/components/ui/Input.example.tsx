/**
 * Example: Reusable Input Component
 * 
 * This demonstrates how to create a standardized form input using the design system.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  typography,
  componentStyles,
  semanticColors,
  formSpacing,
  moderateScale,
} from "@/src/theme";

interface AppInputProps extends TextInputProps {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  showPasswordToggle?: boolean;
}

export function AppInput({
  label,
  containerStyle,
  showPasswordToggle = false,
  secureTextEntry,
  ...inputProps
}: AppInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = showPasswordToggle || secureTextEntry;
  const actuallySecure = isPassword && !isPasswordVisible;

  return (
    <View style={[{ gap: formSpacing.labelMarginBottom }, containerStyle]}>
      {label && (
        <Text
          style={[
            typography.label,
            { color: semanticColors.text.secondary, marginLeft: moderateScale(4) },
          ]}
        >
          {label}
        </Text>
      )}

      <View
        style={[
          componentStyles.input,
          {
            borderColor: isFocused
              ? semanticColors.text.link
              : semanticColors.input.border,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          secureTextEntry={actuallySecure}
          style={[
            typography.input,
            {
              flex: 1,
              height: "100%",
              paddingHorizontal: moderateScale(12),
              paddingRight: isPassword ? moderateScale(40) : moderateScale(12),
              color: semanticColors.input.text,
            },
          ]}
          placeholderTextColor={semanticColors.input.placeholder}
          onFocus={(e) => {
            setIsFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            inputProps.onBlur?.(e);
          }}
        />

        {isPassword && (
          <Pressable
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={{
              position: "absolute",
              right: moderateScale(12),
              top: "50%",
              transform: [{ translateY: -12 }],
            }}
          >
            <MaterialIcons
              name={isPasswordVisible ? "visibility" : "visibility-off"}
              size={24}
              color={semanticColors.input.placeholder}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * Usage Examples:
 * 
 * // Basic input
 * <AppInput 
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 *   keyboardType="email-address"
 *   autoCapitalize="none"
 * />
 * 
 * // Password with toggle
 * <AppInput 
 *   label="Password"
 *   placeholder="Enter your password"
 *   value={password}
 *   onChangeText={setPassword}
 *   showPasswordToggle
 * />
 * 
 * // Custom styling
 * <AppInput 
 *   label="Username"
 *   placeholder="Choose a username"
 *   value={username}
 *   onChangeText={setUsername}
 *   containerStyle={{ marginBottom: spacing.md }}
 * />
 */
