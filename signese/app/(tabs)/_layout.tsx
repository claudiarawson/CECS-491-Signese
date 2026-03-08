import { Tabs } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { moderateScale, navigationStyles, navigationTheme } from "@/src/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: navigationStyles.tabBar,
        tabBarLabelStyle: navigationStyles.tabLabel,
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
            <MaterialIcons name="home" size={moderateScale(20)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="translate"
        options={{
          title: "Translate",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="waving-hand" size={moderateScale(20)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: "Learn",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="menu-book" size={moderateScale(20)} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dictionary"
        options={{
          title: "Dictionary",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="manage-search" size={moderateScale(20)} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
    </Tabs>
  );
}
