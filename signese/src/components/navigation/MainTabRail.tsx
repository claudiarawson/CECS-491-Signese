import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, usePathname, type Href } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Sizes, fontWeight } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

const TAB_ICON_SIZE = Sizes.iconMd;

type TabKey = "home" | "translate" | "learn" | "dictionary";

const TABS: readonly {
  key: TabKey;
  title: string;
  href: Href;
  icon: keyof typeof MaterialIcons.glyphMap;
}[] = [
  { key: "home", title: "Home", href: "/(tabs)/home", icon: "home" },
  { key: "translate", title: "Translate", href: "/(tabs)/translate", icon: "waving-hand" },
  { key: "learn", title: "Learn", href: "/(tabs)/learn", icon: "menu-book" },
  { key: "dictionary", title: "Dictionary", href: "/(tabs)/dictionary", icon: "manage-search" },
];

function activeKeyFromPath(pathname: string): TabKey {
  if (pathname.includes("dictionary")) return "dictionary";
  if (pathname.includes("learn")) return "learn";
  if (pathname.includes("translate")) return "translate";
  if (pathname.includes("home")) return "home";
  return "translate";
}

export function MainTabRail() {
  const pathname = usePathname() ?? "";
  const activeKey = useMemo(() => activeKeyFromPath(pathname), [pathname]);

  return (
    <View style={styles.tabBar} accessibilityRole="tablist">
      {TABS.map((t) => {
        const active = t.key === activeKey;
        return (
          <Pressable
            key={t.key}
            style={({ pressed }) => [styles.tabItem, pressed && { opacity: 0.92 }]}
            onPress={() => router.replace(t.href)}
            accessibilityRole="tab"
            accessibilityLabel={t.title}
            accessibilityState={{ selected: active }}
          >
            <MaterialIcons
              name={t.icon}
              size={TAB_ICON_SIZE}
              color={active ? asl.tabBar.active : asl.tabBar.inactive}
            />
            <Text style={[styles.tabLabel, { color: active ? asl.tabBar.active : asl.tabBar.inactive }]}>
              {t.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 62,
    borderRadius: 22,
    borderTopWidth: 0,
    backgroundColor: asl.tabBar.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: asl.tabBar.border,
    paddingBottom: 6,
    paddingTop: 4,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 }},
      android: { elevation: 14 },
      default: {}})},
  tabLabel: {
    fontSize: 11,
    marginBottom: 2,
    fontWeight: fontWeight.medium},
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    gap: 2,
    minWidth: 0}});
