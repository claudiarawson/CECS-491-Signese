import {
  HeaderActionButton,
  HeaderAvatarButton,
  ScreenContainer,
  ScreenHeader,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { asl } from "@/src/theme/aslConnectTheme";
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

export default function SettingsScreen() {
  const { profile } = useAuthUser();
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
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) =>
      [item.label, ...(item.keywords ?? [])].join(" ").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <ScreenContainer backgroundColor={asl.gradient[0]} contentStyle={styles.safeContent}>
      <ScreenHeader
        title="Settings"
        showBackButton
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings" as any)}
            />
            <HeaderAvatarButton
              avatar={profile?.avatar}
              onPress={() => router.push("/(tabs)/account" as any)}
            />
          </>
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Customize your experience</Text>
          <Text style={styles.heroSubtitle}>
            Notifications, appearance, privacy, and account preferences.
          </Text>
        </View>

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={searchIconSize} color={asl.text.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Settings"
            placeholderTextColor={asl.text.muted}
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
            <MaterialIcons name="chevron-right" size={chevronSize} color={asl.text.secondary} />
          </Pressable>
        ))}

        {filteredItems.length === 0 && (
          <Text style={styles.emptyText}>No matching settings found.</Text>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const createStyles = (density: number) => {
  const ms = (v: number) => moderateScale(v) * density;

  return StyleSheet.create({
    safeContent: { flex: 1 },

    scrollView: {
      flex: 1,
      paddingTop: Spacing.xs,
    },
    heroCard: {
      borderRadius: asl.radius.lg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: asl.glass.bg,
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(14),
      marginBottom: Spacing.cardGap,
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
      marginBottom: Spacing.cardGap,
      height: ms(42),
      borderRadius: ms(21),
      backgroundColor: asl.glass.bg,
      paddingHorizontal: Spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: asl.glass.border,
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
      backgroundColor: asl.glass.bg,
      borderRadius: ms(18),
      marginBottom: Spacing.xs,
      borderWidth: 1,
      borderColor: asl.glass.border,
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