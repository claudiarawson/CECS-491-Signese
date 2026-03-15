import { ViewStyle, TextStyle } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { semanticColors } from "./colors";

/**
 * Standard Component Dimensions & Styles
 * Use these for consistent component sizing across all screens
 */

/**
 * Logo sizes
 */
export const logoSize = {
  landing: moderateScale(90),
  auth: moderateScale(48),
  authSmall: moderateScale(44),
} as const;

/**
 * Input field styles
 */
export const inputStyles = {
  height: moderateScale(36),
  heightSmall: moderateScale(34),
  borderRadius: moderateScale(18),
  borderRadiusSmall: moderateScale(17),
  paddingHorizontal: moderateScale(12),
  fontSize: moderateScale(13),
} as const;

/**
 * Button dimensions
 */
export const buttonDimensions = {
  // Primary CTA buttons
  primary: {
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    paddingHorizontal: moderateScale(24),
  },
  
  // Secondary buttons
  secondary: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    paddingHorizontal: moderateScale(32),
  },
  
  // Small buttons (e.g., back button)
  small: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
  },
} as const;

/**
 * Reusable component style presets
 */
export const componentStyles = {
  // Standard card container
  card: {
    backgroundColor: semanticColors.background.card,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
  } as ViewStyle,
  
  // Input field
  input: {
    height: inputStyles.height,
    borderRadius: inputStyles.borderRadius,
    backgroundColor: semanticColors.input.background,
    borderWidth: 1,
    borderColor: semanticColors.input.border,
    paddingHorizontal: inputStyles.paddingHorizontal,
    color: semanticColors.input.text,
  } as ViewStyle,
  
  // Primary button
  buttonPrimary: {
    height: buttonDimensions.primary.height,
    borderRadius: buttonDimensions.primary.borderRadius,
    backgroundColor: semanticColors.button.primary,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  
  // Secondary button (outline)
  buttonSecondary: {
    height: buttonDimensions.secondary.height,
    borderRadius: buttonDimensions.secondary.borderRadius,
    backgroundColor: semanticColors.button.secondary,
    borderWidth: 1.5,
    borderColor: semanticColors.button.border,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  
  // Back button (circular)
  backButton: {
    width: buttonDimensions.small.width,
    height: buttonDimensions.small.height,
    borderRadius: buttonDimensions.small.borderRadius,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  
  // Centered content container
  centeredContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  } as ViewStyle,
  
  // Form content wrapper
  formContainer: {
    width: "100%" as const,
    maxWidth: moderateScale(340),
    alignItems: "center" as const,
  } as ViewStyle,
} as const;

/**
 * Common layout helpers
 */
export const layout = {
  screenContainer: {
    flex: 1,
  } as ViewStyle,
  
  safeArea: {
    flex: 1,
  } as ViewStyle,
  
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(14),
  } as ViewStyle,
  
  row: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  } as ViewStyle,
  
  rowSpaceBetween: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  } as ViewStyle,
} as const;
