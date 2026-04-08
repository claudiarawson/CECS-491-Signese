import { moderateScale } from "./responsive";

export const Radius = {
  sm: moderateScale(12),
  md: moderateScale(16),
  lg: moderateScale(24),
  xl: moderateScale(32),
} as const;
