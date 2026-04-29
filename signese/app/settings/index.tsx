import {
  ScreenContainer,
} from "@/src/components/layout";
import { asl } from "@/src/theme/aslConnectTheme";
import { GlassCard, GradientBackground } from "@/src/components/asl";
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

function SettingsHeader() {
  return (
    <View style={headerStyles.row}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [headerStyles.iconBtn, pressed && { opacity: 0.85 }]}
      >
        <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
      </Pressable>
      <Text style={headerStyles.title}>Settings</Text>
      <View style={headerStyles.right}>
        <Pressable
          onPress={() => router.push("/(tabs)/settings" as any)}
          style={({ pressed }) => [headerStyles.iconBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="settings" size={22} color={asl.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={({ pressed }) => [headerStyles.iconBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
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
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: asl.text.primary,
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
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
});

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
        keywords: ["info", "application", "app", "version"],
        icon: "info",
        iconBg: "rgba(56, 189, 248, 0.18)",
        iconColor: "#38BDF8",
        onPress: () => router.push("/settings/about"),
      },
      {
        key: "accessibility",
        label: "Accessibility",
        keywords: ["font", "voice", "vision", "support"],
        icon: "accessibility",
        iconBg: "rgba(244, 114, 182, 0.18)",
        iconColor: "#F472B6",
        onPress: () => router.push("/settings/accessibility"),
      },
      {
        key: "notifications",
        label: "Notifications",
        keywords: ["alerts", "reminders", "messages"],
        icon: "notifications-none",
        iconBg: "rgba(34, 211, 238, 0.16)",
        iconColor: "#22D3EE",
        onPress: () => router.push("/settings/notifications" as any),
      },
      {
        key: "appearance",
        label: "Appearance",
        keywords: ["theme", "dark mode", "light mode"],
        icon: "nightlight",
        iconBg: "rgba(168, 85, 247, 0.18)",
        iconColor: "#C084FC",
        onPress: () => router.push("/settings/appearance" as any),
      },
      {
        key: "privacy",
        label: "Privacy & Security",
        keywords: ["privacy", "security"],
        icon: "verified-user",
        iconBg: "rgba(251, 191, 36, 0.16)",
        iconColor: "#FBBF24",
        onPress: () => router.push("/settings/privacy-security" as any),
      },
      {
        key: "feedback",
        label: "Feedback",
        keywords: ["support", "bug", "contact"],
        icon: "feedback",
        iconBg: "rgba(236, 72, 153, 0.18)",
        iconColor: "#EC4899",
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
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.safeContent}
        contentPadded={false}
      >
        <SettingsHeader />
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.stack}>
          <GlassCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Customize your experience</Text>
          <Text style={styles.heroSubtitle}>
            Notifications, appearance, privacy, and account preferences.
          </Text>
          </GlassCard>

        <GlassCard style={styles.searchWrap}>
          <MaterialIcons name="search" size={searchIconSize} color={asl.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Settings"
            placeholderTextColor={asl.text.muted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
        </GlassCard>

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
            <MaterialIcons name="chevron-right" size={chevronSize} color={asl.text.secondary} />
          </Pressable>
        ))}

        {filteredItems.length === 0 && (
          <Text style={styles.emptyText}>No matching settings found.</Text>
        )}
          </View>
      </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (density: number) => {
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
      ...asl.shadow.card,
    },
    heroTitle: {
      color: asl.text.primary,
      fontSize: ms(18),
      fontWeight: fontWeight.emphasis,
    },
    heroSubtitle: {
      marginTop: ms(4),
      color: asl.text.secondary,
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
    },

    searchInput: {
      ...Typography.body,
      flex: 1,
      fontSize: ms(14),
      color: asl.text.primary,
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
      borderColor: asl.glass.border,
      backgroundColor: asl.glass.bg,
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
      color: asl.text.primary,
    },

    emptyText: {
      ...Typography.body,
      color: asl.text.secondary,
      textAlign: "center",
      marginTop: ms(10),
    },
  });
};