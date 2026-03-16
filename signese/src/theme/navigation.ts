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
    height: Platform.OS === "ios" ? 84 : 84,
    width: "100%",
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: navigationTheme.border,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    ...Typography.caption,
    fontSize: fontScale(10),
    marginTop: 2,
    marginBottom: 2,
  },
  topHeaderAccent: {
    backgroundColor: navigationTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: navigationTheme.border,
  },
});
