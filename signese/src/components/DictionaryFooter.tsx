import { Spacing, getDeviceDensity, moderateScale } from "@/src/theme";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

const TEAL = "#48b4a8";

/** Shared bottom bar for dictionary tab + saved signs (same layout and scaling). */
export function DictionaryFooter() {
  const { textScale } = useAccessibility();
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  return (
    <View style={styles.bottomRow}>
      <Pressable style={styles.bottomBtn} onPress={() => router.push("/dictionary/add-dialect")}>
        <Text style={styles.bottomBtnText}>＋ Add Sign</Text>
      </Pressable>

      <Pressable style={styles.bottomBtn} onPress={() => router.push("/dictionary/saved")}>
        <Text style={styles.bottomBtnText}>≡ Saved Signs</Text>
      </Pressable>
    </View>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    bottomRow: {
      position: "absolute",
      left: Spacing.screenPadding,
      right: Spacing.screenPadding,
      bottom: ms(18),
      flexDirection: "row",
      gap: ms(12),
    },
    bottomBtn: {
      flex: 1,
      backgroundColor: TEAL,
      borderRadius: ms(18),
      paddingVertical: ms(14),
      alignItems: "center",
      justifyContent: "center",
    },
    bottomBtnText: {
      color: "white",
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "800",
    },
  });
};
