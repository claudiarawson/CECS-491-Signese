import { moderateScale, verticalScale } from "./responsive";

export const Sizes = {
  headerHeight: verticalScale(48),
  tabBarHeight: verticalScale(58),
  avatarSmall: moderateScale(34),
  avatarMedium: moderateScale(44),
  iconSm: moderateScale(16),
  iconMd: moderateScale(20),
  iconLg: moderateScale(24),
  buttonHeight: verticalScale(48),
  statCardHeight: verticalScale(92),
  progressCardHeight: verticalScale(108),
  sectionCardRadius: moderateScale(20),
  buttonRadius: moderateScale(18),
} as const;
