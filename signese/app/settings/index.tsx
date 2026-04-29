import { ScreenContainer } from "@/src/components/layout";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  Spacing,
  Typography,
  fontWeight,
  getDeviceDensity,
  moderateScale,
} from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

type SettingsItem = {
  key: string;
  label: string;
  keywords?: string[];
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  iconBg: string;
  iconColor: string;
  onPress: () => void;
};

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function SettingsHeader({
  colors,
}: {
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
  };
}) {
  return (
    <View style={[headerStyles.row, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          headerStyles.iconBtn,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
          pressed && { opacity: 0.85 },
        ]}
      >
        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={[headerStyles.title, { color: colors.text }]}>Settings</Text>

      <View style={headerStyles.right}>
        <Pressable
          onPress={() => router.push("/(tabs)/settings" as any)}
          style={({ pressed }) => [
            headerStyles.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialIcons name="settings" size={22} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={({ pressed }) => [
            headerStyles.iconBtn,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
            pressed && { opacity: 0.85 },
          ]}
        >
          <MaterialIcons name="account-circle" size={26} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default function SettingsScreen() {
  const { colors } = useTheme();
  const [query, setQuery] = useState("");

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, colors), [density, colors]);

  const searchIconSize = moderateScale(18) * density;
  const cardIconSize = moderateScale(18) * density;
  const chevronSize = moderateScale(22) * density;

  const items: SettingsItem[] = useMemo(
    () => [
      {
        key: "about",
        label: "About",
        keywords: ["info", "application", "app", "version"],
        icon: "info",
        iconBg: "#DDF1F8",
        iconColor: "#6CB5D1",
        onPress: () => router.push("/settings/about"),
      },
      {
        key: "accessibility",
        label: "Accessibility",
        keywords: ["font", "voice", "vision", "support"],
        icon: "accessibility",
        iconBg: "#F8E4DD",
        iconColor: "#F4A78E",
        onPress: () => router.push("/settings/accessibility"),
      },
      {
        key: "notifications",
        label: "Notifications",
        keywords: ["alerts", "reminders", "messages"],
        icon: "notifications-none",
        iconBg: "#DDEFE9",
        iconColor: "#53B1A3",
        onPress: () => router.push("/settings/notifications" as any),
      },
      {
        key: "appearance",
        label: "Appearance",
        keywords: ["theme", "dark mode", "light mode"],
        icon: "nightlight",
        iconBg: "#E9E1F1",
        iconColor: "#B192CE",
        onPress: () => router.push("/settings/appearance" as any),
      },
      {
        key: "privacy",
        label: "Privacy & Security",
        keywords: ["privacy", "security"],
        icon: "verified-user",
        iconBg: "#F9F0D9",
        iconColor: "#E1B245",
        onPress: () => router.push("/settings/privacy-security" as any),
      },
      {
        key: "feedback",
        label: "Feedback",
        keywords: ["support", "bug", "contact"],
        icon: "feedback",
        iconBg: "#FCE6DF",
        iconColor: "#F7A78D",
        onPress: () => router.push("/settings/feedback"),
      },
    ],
    []
  );

  const filteredItems = useMemo(() => {
    const q = normalizeSearchText(query);
    if (!q) return items;

    return items.filter((item) => {
      const searchable = normalizeSearchText(
        [item.key, item.label, ...(item.keywords ?? [])].join(" ")
      );
      return searchable.includes(q);
    });
  }, [items, query]);

  return (
    <ScreenContainer
      backgroundColor={colors.background}
      safeStyle={{ backgroundColor: colors.background }}
      contentStyle={styles.safeContent}
      contentPadded={false}
    >
      <SettingsHeader colors={colors} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stack}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>Customize your experience</Text>
            <Text style={styles.heroSubtitle}>
              Notifications, appearance, privacy, and account preferences.
            </Text>
          </View>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={searchIconSize} color={colors.subtext} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Settings"
              placeholderTextColor={colors.subtext}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {filteredItems.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.9 }]}
              onPress={item.onPress}
            >
              <View style={styles.itemLeft}>
                <View style={[styles.iconChip, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon} size={cardIconSize} color={item.iconColor} />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={chevronSize} color={colors.text} />
            </Pressable>
          ))}

          {filteredItems.length === 0 && (
            <Text style={styles.emptyText}>No matching settings found.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (
  density: number,
  colors: {
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    primary: string;
  }
) => {
  const ms = (v: number) => moderateScale(v) * density;

  return StyleSheet.create({
    safeContent: { flex: 1 },

    scrollView: {
      flex: 1,
    },

    stack: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(16),
      paddingBottom: ms(32),
      gap: ms(10),
    },

    heroCard: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(14),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: ms(18),
    },

    heroTitle: {
      color: colors.text,
      fontSize: ms(18),
      fontWeight: fontWeight.emphasis,
    },

    heroSubtitle: {
      marginTop: ms(4),
      color: colors.subtext,
      fontSize: ms(13),
      lineHeight: ms(18),
      fontWeight: fontWeight.medium,
    },

    searchWrap: {
      height: ms(42),
      borderRadius: ms(21),
      paddingHorizontal: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    searchInput: {
      ...Typography.body,
      flex: 1,
      fontSize: ms(14),
      color: colors.text,
      marginLeft: 8,
    },

    itemCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(11),
      borderRadius: ms(18),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
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
      color: colors.text,
    },

    emptyText: {
      ...Typography.body,
      color: colors.subtext,
      textAlign: "center",
      marginTop: ms(10),
    },
  });
};