<<<<<<< HEAD
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { getDeviceDensity, semanticColors, Typography, Spacing, moderateScale } from "@/src/theme";
import { ScreenContainer } from "@/src/components/layout/Screen";
import { ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout/Header";

type SettingsItem = {
  key: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

export default function SettingsScreen() {
  const [query, setQuery] = useState("");
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density);
  const searchIconSize = moderateScale(18) * density;
  const cardIconSize = moderateScale(18) * density;
  const chevronSize = moderateScale(22) * density;

  const items: SettingsItem[] = useMemo(
    () => [
      {
        key: "about",
        label: "About",
        icon: "info",
        iconBg: "#DDF1F8",
        iconColor: "#6CB5D1",
        onPress: () => router.push("/settings/about"),
      },
      {
        key: "accessibility",
        label: "Accessibility",
        icon: "accessibility",
        iconBg: "#F8E4DD",
        iconColor: "#F4A78E",
        onPress: () => router.push("/settings/accessibility"),
      },
      {
        key: "notifications",
        label: "Notifications",
        icon: "notifications-none",
        iconBg: "#DDEFE9",
        iconColor: "#53B1A3",
        onPress: () => router.push("/settings"),
      },
      {
        key: "appearance",
        label: "Appearance",
        icon: "nightlight",
        iconBg: "#E9E1F1",
        iconColor: "#B192CE",
        onPress: () => router.push("/settings"),
      },
      {
        key: "privacy",
        label: "Privacy & Security",
        icon: "verified-user",
        iconBg: "#F9F0D9",
        iconColor: "#E1B245",
        onPress: () => router.push("/settings"),
      },
      {
        key: "feedback",
        label: "Feedback",
        icon: "feedback",
        iconBg: "#FCE6DF",
        iconColor: "#F7A78D",
        onPress: () => router.push("/settings/feedback"),
      },
    ],
    []
  );

  const filteredItems = items.filter((item) =>
    item.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <ScreenContainer backgroundColor="#F1F6F5" contentStyle={styles.safeContent}>
      <ScreenHeader
        title="Settings"
        right={
          <>
            <HeaderActionButton iconName="settings" onPress={() => router.push("/(tabs)/settings")} density={density} />
            <HeaderAvatarButton avatar="🐨" onPress={() => router.push("/(tabs)/account")} density={density} />
          </>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={searchIconSize} color="#65A7BF" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Settings"
            placeholderTextColor="#8CA4A7"
            style={styles.searchInput}
          />
        </View>

        {filteredItems.map((item) => (
          <Pressable key={item.key} style={styles.itemCard} onPress={item.onPress}>
            <View style={styles.itemLeft}>
              <View style={[styles.iconChip, { backgroundColor: item.iconBg }]}>
                <MaterialIcons name={item.icon} size={cardIconSize} color={item.iconColor} />
              </View>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={chevronSize} color="#111827" />
          </Pressable>
        ))}

        {filteredItems.length === 0 ? <Text style={styles.emptyText}>No matching settings.</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (density: number) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
    safeContent: {
      flex: 1,
    },

    scrollView: {
      flex: 1,
      paddingTop: Spacing.xs,
    },

    searchWrap: {
      marginBottom: Spacing.cardGap,
      height: ms(42),
      borderRadius: ms(21),
      backgroundColor: "#D5E8EA",
      paddingHorizontal: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },

    searchInput: {
      ...Typography.body,
      flex: 1,
      fontSize: ms(14),
      color: semanticColors.text.primary,
      fontWeight: "600",
    },

    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(11),
      backgroundColor: "#FFFFFF",
      borderRadius: ms(18),
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: "#E5ECEA",
    },

    itemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      gap: Spacing.xs,
    },

    iconChip: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      alignItems: "center",
      justifyContent: "center",
    },

    itemLabel: {
      ...Typography.sectionTitle,
      fontSize: ms(16),
      fontWeight: "700",
      color: semanticColors.text.primary,
    },

    emptyText: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      textAlign: "center",
      marginTop: ms(10),
    },
  });
};
=======
import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>

      {/* Top Header */}
      <View style={styles.topHeader}>
        <Text style={styles.header}>Settings</Text>

        <View style={styles.headerIcons}>
          <View style={styles.headerIconCircle}>
            <Text style={styles.headerIcon}>⚙️</Text>
          </View>

          <View style={[styles.headerIconCircle, styles.profileCircle]}>
            <Text style={styles.headerIcon}>🐵</Text>
          </View>
        </View>
      </View>

      {/* About */}
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/about")}
      >
        <View style={styles.leftSection}>
          <View style={[styles.iconCircle, styles.aboutIconBg]}>
            <Text style={[styles.iconLetter, styles.aboutIconText]}>i</Text>
          </View>
          <Text style={[styles.rowText, styles.aboutText]}>About</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

      {/* Accessibility */}
      <Pressable
        style={styles.row}
        onPress={() => router.push("/settings/accessibility")}
      >
        <View style={styles.leftSection}>
          <View style={[styles.iconCircle, styles.accessIconBg]}>
            <Text style={[styles.iconLetter, styles.accessIconText]}>CC</Text>
          </View>
          <Text style={[styles.rowText, styles.accessText]}>
            Accessibility
          </Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef7f6",
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  /* HEADER */
  topHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  header: {
    fontSize: 32,
    fontWeight: "900",
    color: "#111",
    letterSpacing: -0.5,
  },

  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },

  headerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e6f1ef",
    alignItems: "center",
    justifyContent: "center",
  },

  profileCircle: {
    backgroundColor: "#eadff1",
  },

  headerIcon: {
    fontSize: 18,
  },

  /* ROWS */
  row: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingVertical: 22,
    paddingHorizontal: 22,
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
  },

  iconLetter: {
    fontSize: 20,
    fontWeight: "700",
  },

  /* About Styling */
  aboutIconBg: {
    backgroundColor: "#d9edf7",
  },
  aboutIconText: {
    color: "#3b82f6",
  },
  aboutText: {
    color: "#2563eb",
  },

  /* Accessibility Styling */
  accessIconBg: {
    backgroundColor: "#fde7dd",
  },
  accessIconText: {
    color: "#f97316",
  },
  accessText: {
    color: "#ea580c",
  },

  rowText: {
    fontSize: 19,
    fontWeight: "700",
  },

  arrow: {
    fontSize: 24,
    color: "#aaa",
  },
});
>>>>>>> feature/dictionary-settings-nav
