import { Platform, TextStyle } from "react-native";
import { fontScale } from "./responsive";

/**
 * Standard Font Families
 * Use these consistently across all screens
 */
export const fontFamily = {
  heading: Platform.select({
    ios: "AvenirNext-Bold",
    android: "sans-serif-medium",
    default: "System",
  }),
  body: Platform.select({
    ios: "AvenirNext-Regular",
    android: "sans-serif",
    default: "System",
  }),
  medium: Platform.select({
    ios: "AvenirNext-DemiBold",
    android: "sans-serif-medium",
    default: "System",
  }),
} as const;

/**
 * Typography Presets
 * Reusable text styles for consistent typography across the app
 */
export const typography = {
  screenTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontScale(24),
    fontWeight: "700" as const,
    lineHeight: fontScale(30),
  },

  sectionTitle: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(17),
    fontWeight: "600" as const,
    lineHeight: fontScale(22),
  },

  body: {
    fontFamily: fontFamily.body,
    fontSize: fontScale(14),
    fontWeight: "400" as const,
    lineHeight: fontScale(20),
  },

  statNumber: {
    fontFamily: fontFamily.heading,
    fontSize: fontScale(20),
    fontWeight: "700" as const,
    lineHeight: fontScale(24),
  },

  button: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(16),
    fontWeight: "600" as const,
    lineHeight: fontScale(20),
  },

  // Page titles (e.g., "Welcome Back!", "Create Account")
  pageTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontScale(32),
    lineHeight: fontScale(36),
    fontWeight: "700" as const,
    letterSpacing: -0.2,
  },

  // Page subtitles (e.g., "Sign in to continue learning!")
  pageSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
    fontWeight: "400" as const,
  },

  // Landing page title (larger)
  landingTitle: {
    fontFamily: fontFamily.heading,
    fontSize: fontScale(40),
    lineHeight: fontScale(44),
    fontWeight: "700" as const,
    letterSpacing: 1,
  },

  // Landing page subtitle
  landingSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: fontScale(16),
    lineHeight: fontScale(22),
    fontWeight: "400" as const,
  },

  // Form labels (e.g., "Username", "Email", "Password")
  label: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(11),
    fontWeight: "500" as const,
  },

  // Input text
  input: {
    fontFamily: fontFamily.body,
    fontSize: fontScale(13),
    fontWeight: "400" as const,
  },

  // Button text (primary CTAs)
  buttonPrimary: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(16),
    lineHeight: fontScale(20),
    fontWeight: "700" as const,
  },

  // Button text (secondary/outline buttons)
  buttonSecondary: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
    fontWeight: "600" as const,
  },

  // Links and small text
  link: {
    fontFamily: fontFamily.medium,
    fontSize: fontScale(12),
    fontWeight: "600" as const,
  },

  // Caption/helper text
  caption: {
    fontFamily: fontFamily.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(16),
    fontWeight: "400" as const,
  },
} as const;

export const Typography = {
  screenTitle: typography.screenTitle,
  sectionTitle: typography.sectionTitle,
  body: typography.body,
  caption: typography.caption,
  statNumber: typography.statNumber,
  button: typography.button,
} as const;

export const lessonTypography = {
  title: typography.screenTitle,
  subtitle: typography.sectionTitle,
  body: typography.body,
  button: typography.button,
  caption: typography.caption,
} as const;

/**
 * Helper function to apply typography preset
 * Usage: const titleStyle = applyTypography(typography.pageTitle, { color: '#000' })
 */
export function applyTypography(
  preset: TextStyle,
  override?: TextStyle
): TextStyle {
  return { ...preset, ...override };
}
