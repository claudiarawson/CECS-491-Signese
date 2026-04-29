import React from "react";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { asl } from "@/src/theme/aslConnectTheme";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

export function GlassCard({ children, style, contentStyle }: Props) {
  if (Platform.OS === "ios") {
    return (
      <View style={[styles.wrap, asl.shadow.card, style]}>
        <BlurView intensity={48} tint="dark" style={[styles.blur, contentStyle]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, styles.fallback, asl.shadow.card, style, contentStyle]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: asl.radius.lg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    overflow: "hidden",
  },
  blur: {
    borderRadius: asl.radius.lg,
    padding: 16,
    backgroundColor: "rgba(8,2,10,0.3)",
  },
  fallback: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
  },
});
