import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Sizes } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

const TAB_ICON_SIZE = Sizes.iconMd;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: asl.tabBar.active,
        tabBarInactiveTintColor: asl.tabBar.inactive,
        tabBarItemStyle: styles.tabItem,
      }}
    >
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
  tabBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 28 : 16,
    height: 62,
    borderRadius: 22,
    borderTopWidth: 0,
    backgroundColor: asl.tabBar.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: asl.tabBar.border,
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
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },
  tabItem: {
    paddingTop: 4,
  },
});
