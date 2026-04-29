import { TextStyle } from "react-native";
import { fontScale } from "./responsive";

/**
 * App-wide typeface: Inter (loaded in root layout via @expo-google-fonts/inter).
 * Use heading / medium / label / body for weight; all are the same Inter family.
 */
const INTER_FONTS = {
  heading: "Inter_700Bold",
  medium: "Inter_600SemiBold",
  label: "Inter_500Medium",
  body: "Inter_400Regular",
} as const;

export const fontFamily = INTER_FONTS;

/**
 * Typography Presets
 * Reusable text styles for consistent typography across the app
 */
export const typography = {
  screenTitle: {
    fontFamily: INTER_FONTS.heading,
    fontSize: fontScale(24),
    lineHeight: fontScale(30),
  },

  sectionTitle: {
    fontFamily: INTER_FONTS.medium,
    fontSize: fontScale(17),
    lineHeight: fontScale(22),
  },

  body: {
    fontFamily: INTER_FONTS.body,
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
  },

  statNumber: {
    fontFamily: INTER_FONTS.heading,
    fontSize: fontScale(20),
    lineHeight: fontScale(24),
  },

  button: {
    fontFamily: INTER_FONTS.medium,
    fontSize: fontScale(16),
    lineHeight: fontScale(20),
  },

  pageTitle: {
    fontFamily: INTER_FONTS.heading,
    fontSize: fontScale(32),
    lineHeight: fontScale(36),
    letterSpacing: -0.2,
  },

  pageSubtitle: {
    fontFamily: INTER_FONTS.body,
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
  },

  landingTitle: {
    fontFamily: INTER_FONTS.heading,
    fontSize: fontScale(40),
    lineHeight: fontScale(44),
    letterSpacing: 1,
  },

  landingSubtitle: {
    fontFamily: INTER_FONTS.body,
    fontSize: fontScale(16),
    lineHeight: fontScale(22),
  },

  label: {
    fontFamily: INTER_FONTS.label,
    fontSize: fontScale(11),
    lineHeight: fontScale(14),
  },

  input: {
    fontFamily: INTER_FONTS.body,
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
  },

  buttonPrimary: {
    fontFamily: INTER_FONTS.heading,
    fontSize: fontScale(16),
    lineHeight: fontScale(20),
  },

  buttonSecondary: {
    fontFamily: INTER_FONTS.medium,
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
  },

  link: {
    fontFamily: INTER_FONTS.medium,
    fontSize: fontScale(12),
    lineHeight: fontScale(16),
  },

  caption: {
    fontFamily: INTER_FONTS.body,
    fontSize: fontScale(12),
    lineHeight: fontScale(16),
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

export function applyTypography(preset: TextStyle, override?: TextStyle): TextStyle {
  return { ...preset, ...override };
}
