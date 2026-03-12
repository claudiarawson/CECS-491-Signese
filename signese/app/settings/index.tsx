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