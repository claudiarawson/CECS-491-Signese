import { moderateScale, verticalScale } from "./responsive";

/**
 * Standard Spacing System
 * Use these constants for consistent spacing across all screens
 */
export const Spacing = {
  xs: moderateScale(8),
  sm: moderateScale(12),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),

  sectionGap: verticalScale(18),
  cardGap: verticalScale(14),
  screenPadding: moderateScale(20),
  screenTop: verticalScale(18),
} as const;

// Backward-compatible alias
export const spacing = {
  xs: Spacing.xs,
  sm: Spacing.sm,
  md: Spacing.md,
  lg: Spacing.lg,
  xl: Spacing.xl,
  xxl: moderateScale(40),
} as const;

/**
 * Screen padding/margins
 */
export const screenPadding = {
  horizontal: Spacing.screenPadding,
  vertical: Spacing.md,
  top: Spacing.screenTop,
  bottom: verticalScale(14),
} as const;

/**
 * Card/Container spacing
 */
export const cardSpacing = {
  padding: Spacing.sm,
  paddingVertical: moderateScale(10),
  paddingHorizontal: Spacing.sm,
  borderRadius: moderateScale(24),
  margin: Spacing.xs,
} as const;

/**
 * Form element spacing
 */
export const formSpacing = {
  labelMarginBottom: moderateScale(3),
  inputMarginBottom: moderateScale(5),
  fieldGap: moderateScale(6),
  sectionGap: Spacing.sectionGap,
} as const;
