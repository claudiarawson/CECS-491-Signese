import {
  HeaderActionButton,
  HeaderAvatarButton,
  ScreenContainer,
  ScreenHeader,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import {
  Spacing,
  Typography,
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
    <ScreenContainer backgroundColor={colors.background} contentStyle={styles.safeContent}>
      <ScreenHeader
        title="Appearance"
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

      <View style={styles.content}>
        <Text style={styles.title}>Choose Theme</Text>
        <Text style={styles.subtitle}>
          Pick the look you want for the app. Your choice will be saved automatically.
        </Text>

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
                Bright background with dark text
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
                Dark background with light text
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
  );
}

const createStyles = (density: number, colors: any) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
    safeContent: {
      flex: 1,
    },

    content: {
      flex: 1,
      paddingTop: Spacing.sm,
    },

    title: {
      ...Typography.sectionTitle,
      fontSize: ms(22),
      fontWeight: "800",
      color: colors.text,
      marginBottom: ms(6),
    },

    subtitle: {
      ...Typography.body,
      fontSize: ms(14),
      color: colors.subtext,
      marginBottom: ms(18),
      lineHeight: ms(20),
    },

    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.sm,
      paddingVertical: ms(14),
      borderRadius: ms(18),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: Spacing.sm,
    },

    optionCardSelected: {
      borderColor: colors.primary,
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
      color: colors.text,
    },

    optionSubtitle: {
      ...Typography.body,
      fontSize: ms(13),
      color: colors.subtext,
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