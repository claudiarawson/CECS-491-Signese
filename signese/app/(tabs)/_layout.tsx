import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Sizes, navigationStyles, navigationTheme } from "@/src/theme";

const TAB_ICON_SIZE = Sizes.iconMd;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        tabBarStyle: navigationStyles.tabBar,
        tabBarLabelStyle: navigationStyles.tabLabel,
        tabBarAllowFontScaling: false,
        tabBarActiveTintColor: navigationTheme.activeTint,
        tabBarInactiveTintColor: navigationTheme.inactiveTint,
        tabBarItemStyle: navigationStyles.tabItem,
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
