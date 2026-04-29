import { TextStyle } from "react-native";
import { fontScale } from "./responsive";

/**
 * System UI font + fontWeight (same pattern as Dictionary / tab screens).
 * Do not set fontFamily on Text so platform defaults apply (SF Pro, Roboto, etc.).
 */
export const fontWeight = {
  /** Section titles, tab headers, primary actions */
  emphasis: "800" as const,
  /** Strong labels, chips */
  strong: "700" as const,
  /** Secondary labels, buttons */
  medium: "600" as const,
  /** Small emphasis */
  label: "600" as const,
} as const;

/**
 * Typography Presets
 */
export const typography = {
  screenTitle: {
    fontWeight: fontWeight.emphasis,
    fontSize: fontScale(24),
    lineHeight: fontScale(30),
  },

  sectionTitle: {
    fontWeight: fontWeight.strong,
    fontSize: fontScale(17),
    lineHeight: fontScale(22),
  },

  body: {
    fontSize: fontScale(14),
    lineHeight: fontScale(20),
  },

  statNumber: {
    fontWeight: fontWeight.emphasis,
    fontSize: fontScale(20),
    lineHeight: fontScale(24),
  },

  button: {
    fontWeight: fontWeight.medium,
    fontSize: fontScale(16),
    lineHeight: fontScale(20),
  },

  pageTitle: {
    fontWeight: fontWeight.emphasis,
    fontSize: fontScale(32),
    lineHeight: fontScale(36),
    letterSpacing: -0.2,
  },

  pageSubtitle: {
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
  },

  landingTitle: {
    fontWeight: fontWeight.emphasis,
    fontSize: fontScale(40),
    lineHeight: fontScale(44),
    letterSpacing: 1,
  },

  landingSubtitle: {
    fontSize: fontScale(16),
    lineHeight: fontScale(22),
  },

  label: {
    fontWeight: fontWeight.label,
    fontSize: fontScale(11),
    lineHeight: fontScale(14),
  },

  input: {
    fontSize: fontScale(13),
    lineHeight: fontScale(18),
  },

  buttonPrimary: {
    fontWeight: fontWeight.emphasis,
    fontSize: fontScale(16),
    lineHeight: fontScale(20),
  },

  buttonSecondary: {
    fontWeight: fontWeight.medium,
    fontSize: fontScale(18),
    lineHeight: fontScale(22),
  },

  link: {
    fontWeight: fontWeight.medium,
    fontSize: fontScale(12),
    lineHeight: fontScale(16),
  },

  caption: {
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
