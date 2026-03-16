import { StyleSheet } from "react-native";
import { Sizes, Spacing, moderateScale, fontScale } from "./index";
import { Typography } from "./typography";

export const navigationTheme = {
  surface: "#FFFFFF",
  border: "#DCE3E1",
  activeTint: "#20B893",
  inactiveTint: "#8F9497",
} as const;

export const navigationStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: navigationTheme.surface,
    height: Sizes.tabBarHeight,
    paddingTop: moderateScale(4),
    paddingBottom: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: navigationTheme.border,
  },
  tabItem: {
    paddingVertical: moderateScale(2),
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: fontScale(10.5),
    marginBottom: moderateScale(2),
  },
  topHeaderAccent: {
    backgroundColor: navigationTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: navigationTheme.border,
  },
});
