import {
  ScreenContainer,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { GradientBackground, GlassCard } from "@/src/components/asl";
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
import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

export default function AppearanceScreen() {
  const { profile } = useAuthUser();
  const { theme, setTheme, colors } = useTheme();

  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, colors);

  const iconSize = moderateScale(22) * density;
  const checkSize = moderateScale(20) * density;

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.safeContent}
        contentPadded={false}
      >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Appearance</Text>
        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.avatarText}>{profile?.avatar ?? "🙂"}</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <GlassCard style={styles.heroCard}>
        <Text style={styles.title}>Choose Theme</Text>
        <Text style={styles.subtitle}>
          Pick the look you want for the app. Your choice will be saved automatically.
        </Text>
        </GlassCard>

        <Pressable
          style={[
            styles.optionCard,
            theme === "light" && styles.optionCardSelected,
          ]}
          onPress={() => setTheme("light")}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.iconChip, { backgroundColor: "#FDE68A" }]}>
              <MaterialIcons name="light-mode" size={iconSize} color="#B45309" />
            </View>

            <View>
              <Text style={styles.optionTitle}>Light Mode</Text>
              <Text style={styles.optionSubtitle}>
                Brighter glass panels on the maroon–purple gradient
              </Text>
            </View>
          </View>

          {theme === "light" ? (
            <MaterialIcons name="check-circle" size={checkSize} color={colors.primary} />
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
        </Pressable>

        <Pressable
          style={[
            styles.optionCard,
            theme === "dark" && styles.optionCardSelected,
          ]}
          onPress={() => setTheme("dark")}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.iconChip, { backgroundColor: "#DDD6FE" }]}>
              <MaterialIcons name="dark-mode" size={iconSize} color="#6D28D9" />
            </View>

            <View>
              <Text style={styles.optionTitle}>Dark Mode</Text>
              <Text style={styles.optionSubtitle}>
                Softer glass panels on the maroon–purple gradient
              </Text>
            </View>
          </View>

          {theme === "dark" ? (
            <MaterialIcons name="check-circle" size={checkSize} color={colors.primary} />
          ) : (
            <View style={styles.uncheckedCircle} />
          )}
        </Pressable>
      </View>
    </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (density: number, colors: any) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
    safeContent: {
      flex: 1,
      backgroundColor: "transparent",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenPadding,
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: asl.glass.border,
      backgroundColor: "rgba(8,2,10,0.2)",
    },
    headerBtn: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: asl.text.primary,
      fontSize: ms(20),
      lineHeight: ms(26),
      fontWeight: fontWeight.emphasis,
    },
    avatarText: {
      color: asl.text.primary,
      fontSize: ms(18),
    },

    content: {
      flex: 1,
      paddingTop: Spacing.screenPadding,
      paddingHorizontal: Spacing.screenPadding,
    },
    heroCard: {
      padding: Spacing.sm,
      marginBottom: Spacing.sm,
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
    },

    title: {
      ...Typography.sectionTitle,
      fontSize: ms(22),
      fontWeight: "800",
      color: asl.text.primary,
      marginBottom: ms(6),
    },

    subtitle: {
      ...Typography.body,
      fontSize: ms(14),
      color: asl.text.secondary,
      lineHeight: ms(20),
    },

    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(14),
      borderRadius: ms(18),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      marginBottom: Spacing.sm,
    },

    optionCardSelected: {
      borderColor: asl.accentCyan,
      borderWidth: 2,
    },

    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
    },

    iconChip: {
      width: ms(42),
      height: ms(42),
      borderRadius: ms(21),
      alignItems: "center",
      justifyContent: "center",
    },

    optionTitle: {
      ...Typography.sectionTitle,
      fontSize: ms(16),
      fontWeight: "700",
      color: asl.text.primary,
    },

    optionSubtitle: {
      ...Typography.body,
      fontSize: ms(13),
      color: asl.text.secondary,
      marginTop: ms(2),
    },

    uncheckedCircle: {
      width: ms(20),
      height: ms(20),
      borderRadius: ms(10),
      borderWidth: 2,
      borderColor: colors.border,
    },
  });
};