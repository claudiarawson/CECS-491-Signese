import { Platform, StyleSheet } from "react-native";
import { fontScale } from "./responsive";
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
    height: Platform.OS === "ios" ? 78 : 74,
    width: "100%",
    paddingTop: 6,
    paddingBottom: Platform.OS === "ios" ? 16 : 10,
    borderTopWidth: 1,
    borderTopColor: navigationTheme.border,
  },
  tabItem: {
    paddingVertical: 0,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: fontScale(9),
    lineHeight: fontScale(11),
    marginTop: 1,
    marginBottom: 0,
    includeFontPadding: false,
  },
  topHeaderAccent: {
    backgroundColor: navigationTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: navigationTheme.border,
  },
});
