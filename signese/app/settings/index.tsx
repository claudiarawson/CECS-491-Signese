import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, useWindowDimensions } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { getDeviceDensity, semanticColors, Typography, Spacing, moderateScale } from "@/src/theme";
import { ScreenContainer, ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout";

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
            <HeaderActionButton iconName="settings" onPress={() => router.push("/(tabs)/settings")} />
            <HeaderAvatarButton avatar="🐨" onPress={() => router.push("/(tabs)/account")} />
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
