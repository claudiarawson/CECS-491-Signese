import { useTheme } from "@/src/contexts/ThemeContext";
import { getDeviceDensity, moderateScale, Typography } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

export default function AppearanceScreen() {
  const { theme, setTheme, colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, colors);

  const iconSize = moderateScale(22) * density;
  const checkSize = moderateScale(22) * density;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={10}
          accessibilityLabel="Go back"
        >
          <MaterialIcons name="arrow-back" size={iconSize} color={colors.text} />
        </Pressable>

        <Text style={styles.headerTitle}>Appearance</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.title}>Choose Theme</Text>
          <Text style={styles.subtitle}>
            Pick the look you want for the app. Your choice will be saved automatically.
          </Text>
        </View>

        <Pressable
          style={[
            styles.optionCard,
            theme === "light" && styles.optionCardSelected,
          ]}
          onPress={() => void setTheme("light")}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.iconChip, { backgroundColor: "#FDE68A" }]}>
              <MaterialIcons name="light-mode" size={iconSize} color="#B45309" />
            </View>

            <View style={styles.textWrap}>
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
          onPress={() => void setTheme("dark")}
        >
          <View style={styles.optionLeft}>
            <View style={[styles.iconChip, { backgroundColor: "#DDD6FE" }]}>
              <MaterialIcons name="dark-mode" size={iconSize} color="#6D28D9" />
            </View>

            <View style={styles.textWrap}>
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
    </View>
  );
}

const createStyles = (density: number, colors: any) => {
  const ms = (value: number) => moderateScale(value) * density;

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    header: {
      paddingTop: ms(18),
      paddingHorizontal: ms(16),
      paddingBottom: ms(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },

    backButton: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },

    headerTitle: {
      ...Typography.sectionTitle,
      fontSize: ms(24),
      fontWeight: "800",
      color: colors.text,
    },

    headerSpacer: {
      width: ms(40),
      height: ms(40),
    },

    content: {
      flex: 1,
      paddingHorizontal: ms(16),
      paddingTop: ms(18),
    },

    infoCard: {
      backgroundColor: colors.card,
      borderRadius: ms(20),
      paddingHorizontal: ms(18),
      paddingVertical: ms(18),
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: ms(18),
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
      lineHeight: ms(20),
    },

    optionCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: ms(16),
      paddingVertical: ms(16),
      borderRadius: ms(20),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: ms(14),
    },

    optionCardSelected: {
      borderColor: colors.primary,
      borderWidth: 2,
    },

    optionLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    iconChip: {
      width: ms(56),
      height: ms(56),
      borderRadius: ms(28),
      alignItems: "center",
      justifyContent: "center",
      marginRight: ms(14),
    },

    textWrap: {
      flex: 1,
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
      marginTop: ms(3),
    },

    uncheckedCircle: {
      width: ms(22),
      height: ms(22),
      borderRadius: ms(11),
      borderWidth: 2,
      borderColor: colors.border,
    },
  });
};