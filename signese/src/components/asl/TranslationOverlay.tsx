import React from "react";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type Props = {
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  style?: ViewStyle;
  topLeftStyle?: TextStyle;
  topRightStyle?: TextStyle;
};

export function TranslationOverlay({ topLeft, topRight, style, topLeftStyle, topRightStyle }: Props) {
  const content = (
    <View style={[styles.inner, style]}>
      {typeof topLeft === "string" || typeof topLeft === "number" ? (
        <Text style={[styles.pill, topLeftStyle]} numberOfLines={1}>
          {topLeft}
        </Text>
      ) : (
        topLeft
      )}
      {typeof topRight === "string" || typeof topRight === "number" ? (
        <Text style={[styles.pill, topRightStyle]} numberOfLines={1}>
          {topRight}
        </Text>
      ) : (
        topRight
      )}
    </View>
  );

  if (Platform.OS === "ios") {
    return <BlurView intensity={40} tint="dark" style={styles.bar}>{content}</BlurView>;
  }
  return <View style={[styles.bar, styles.fallback]}>{content}</View>;
}

const styles = StyleSheet.create({
  bar: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  fallback: { backgroundColor: "rgba(0,0,0,0.45)" },
  inner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, gap: 8 },
  pill: { color: asl.text.primary, fontSize: 12, flex: 1, minWidth: 0, fontFamily: fontFamily.medium },
});
