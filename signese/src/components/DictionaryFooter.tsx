import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing, getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { router } from "expo-router";
import React from "react";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

/** Must match `app/(tabs)/_layout.tsx` floating tab bar offset + height. */
const TAB_BAR_FLOAT_BOTTOM = Platform.OS === "ios" ? 28 : 16;
const TAB_BAR_HEIGHT = 62;

/** Distance from screen bottom to top edge of tab bar. */
function tabBarTopFromBottom(): number {
  return TAB_BAR_FLOAT_BOTTOM + TAB_BAR_HEIGHT;
}

/** Bottom inset for the +Add / Saved row: sits above the tab bar with a small gap. */
function footerBottomOffset(density: number): number {
  const ms = (value: number) => moderateScale(value) * density;
  return tabBarTopFromBottom() + ms(10);
}

/**
 * FlatList `paddingBottom` so the last signs scroll above footer + tab bar.
 */
export function dictionaryChromePadBottom(density: number): number {
  const ms = (value: number) => moderateScale(value) * density;
  return footerBottomOffset(density) + ms(14) * 2 + ms(22) + ms(18);
}

/** Shared bottom bar for dictionary tab + saved signs (same layout and scaling). */
export function DictionaryFooter() {
  const { textScale } = useAccessibility();
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const insets = useSafeAreaInsets();
  const styles = createStyles(density, textScale, insets.bottom);

  return (
    <View style={styles.bottomRow}>
      <Pressable style={styles.bottomBtnWrap} onPress={() => router.push("/dictionary/add-dialect")}>
        <LinearGradient
          colors={[...asl.primaryButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomBtn}
        >
          <Text style={styles.bottomBtnText}>＋ Add Sign</Text>
        </LinearGradient>
      </Pressable>

      <Pressable style={styles.bottomBtnWrap} onPress={() => router.push("/dictionary/saved")}>
        <LinearGradient
          colors={[...asl.primaryButton]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomBtn}
        >
          <Text style={styles.bottomBtnText}>≡ Saved Signs</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const createStyles = (density: number, textScale: number, safeBottom: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  const baseOffset = footerBottomOffset(density);
  const bottom = baseOffset + Math.max(0, safeBottom - TAB_BAR_FLOAT_BOTTOM);

  return StyleSheet.create({
    bottomRow: {
      position: "absolute",
      left: Spacing.screenPadding,
      right: Spacing.screenPadding,
      bottom,
      flexDirection: "row",
      gap: ms(12),
    },
    bottomBtnWrap: {
      flex: 1,
    },
    bottomBtn: {
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
