import { useTheme } from "@/src/contexts/ThemeContext";
import { Sizes } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { Tabs } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { Platform, StyleSheet } from "react-native";

const TAB_ICON_SIZE = Sizes.iconMd;

export default function TabLayout() {
  const { theme, colors } = useTheme();

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      animation: "fade" as const,
      tabBarStyle: [styles.tabBarBase, theme === "light" ? styles.tabBarLight : styles.tabBarDark],
      tabBarLabelStyle: styles.tabLabel,
      tabBarAllowFontScaling: false,
      tabBarActiveTintColor: theme === "light" ? colors.primary : asl.tabBar.active,
      tabBarInactiveTintColor:
        theme === "light" ? "rgba(15,23,42,0.42)" : asl.tabBar.inactive,
      tabBarItemStyle: styles.tabItem,
    }),
    [theme, colors.primary]
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="home" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="translate"
        options={{
          title: "Translate",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="waving-hand" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="menu-book" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "Dictionary",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="manage-search" size={TAB_ICON_SIZE} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBase: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 28 : 16,
    height: 62,
    borderRadius: 22,
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
    paddingTop: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  tabBarDark: {
    backgroundColor: asl.tabBar.bg,
    borderColor: asl.tabBar.border,
  },
  tabBarLight: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderColor: "rgba(15,23,42,0.10)",
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
