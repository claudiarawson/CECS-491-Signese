import { useTheme } from "@/src/contexts/ThemeContext";
import { asl } from "@/src/theme/aslConnectTheme";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function GlassCard({ children, style, contentStyle }: Props) {
  const { theme, colors } = useTheme();
  const isLight = theme === "light";
  const tint = isLight ? "light" : "dark";
  const borderColor = isLight ? colors.border : asl.glass.border;
  const blurBg = isLight ? "rgba(255,255,255,0.72)" : "rgba(8,2,10,0.3)";
  const fallbackBg = isLight ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.08)";

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.wrap, asl.shadow.card, { borderColor }, style]}>
        <BlurView intensity={isLight ? 72 : 48} tint={tint} style={[styles.blur, { backgroundColor: blurBg }, contentStyle]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View
      style={[styles.wrap, { borderColor, backgroundColor: fallbackBg, padding: 16 }, asl.shadow.card, style, contentStyle]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: asl.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  blur: {
    borderRadius: asl.radius.lg,
    padding: 16,
  },
});
