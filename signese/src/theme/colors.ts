/**
 * Centralized Color System
 * Import page-specific colors and expose them through a unified API
 */

import { landingColors } from "./pages/landing.colors";
import { loginColors } from "./pages/login.colors";
import { signupColors } from "./pages/signup.colors";

/**
 * Common brand colors used across the app
 */
export const brandColors = {
  primary: "#4DB3A8",       // Teal - main brand color
  secondary: "#F7AF97",     // Coral - accent color
  tertiary: "#EBE2FE",      // Light purple
  
  // Neutrals
  dark: "#2F3A40",
  mediumDark: "#6B7280",
  medium: "#94A3A8",
  light: "#E6EFEF",
  lighter: "#F2F8F6",
  
  // Backgrounds
  bgTealLight: "#CFE9E6",
  bgTealLighter: "#D1E0DF",
  bgPurpleLight: "#EBE6F1",
  bgCard: "#F2F8F6",
  
  // Functional
  white: "#FFFFFF",
  transparent: "transparent",
} as const;

/**
 * Semantic color mappings
 * Use these for consistent meaning across screens
 */
export const semanticColors = {
  text: {
    primary: brandColors.dark,
    secondary: brandColors.mediumDark,
    tertiary: brandColors.medium,
    link: brandColors.primary,
  },
  
  background: {
    primary: brandColors.white,
    secondary: brandColors.lighter,
    card: brandColors.bgCard,
  },
  
  input: {
    background: brandColors.light,
    border: "#D6E3E3",
    placeholder: brandColors.medium,
    text: brandColors.dark,
  },
  
  button: {
    primary: brandColors.secondary,
    primaryText: brandColors.dark,
    secondary: brandColors.lighter,
    secondaryText: brandColors.primary,
    border: brandColors.primary,
  },
} as const;

/**
 * Page-specific color palettes
 * Use these when you need page-specific theming
 */
export const pageColors = {
  landing: landingColors,
  login: loginColors,
  signup: signupColors,
} as const;

/**
 * Export all colors for convenience
 */
export const colors = {
  brand: brandColors,
  semantic: semanticColors,
  pages: pageColors,
} as const;

/**
 * Lesson flow color tokens.
 * These are used by the new Learn lesson screens/components.
 */
export const lessonColors = {
  background: "#F5F6F8",
  surface: "#FFFFFF",
  primaryButton: "#58C8B8",
  answerButton: "#DDF5F1",
  textPrimary: "#1F2937",
  textSecondary: "#4B5563",
  progressBackground: "#E9EEF2",
  progressFill: "#58C8B8",
  success: "#27AE60",
  error: "#E35D6A",
  star: "#F4B942",
} as const;
