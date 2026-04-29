import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { scale, verticalScale, fontScale } from "@/src/theme/responsive";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type LessonNodeProps = {
  title: string;
  icon?: any;
  active?: boolean;
  completed?: boolean;
  onPress?: () => void;
};

export function LessonNode({ title, icon, active, completed }: LessonNodeProps) {
  return (
    <View
      style={[
        styles.circle,
        active && styles.circleActive,
        completed && styles.circleCompleted,
      ]}
    >
      {icon ? <Image source={icon} style={styles.icon} resizeMode="contain" /> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: scale(72),
    height: scale(72),
    borderRadius: scale(36),
    backgroundColor: asl.glass.bg,
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
    ...asl.shadow.card,
    marginBottom: verticalScale(12),
  },
  circleActive: {
    borderColor: asl.accentCyan,
    backgroundColor: "rgba(34,211,238,0.12)",
    shadowOpacity: 0.45,
  },
  circleCompleted: {
    borderColor: "#4ADE80",
    backgroundColor: "rgba(74,222,128,0.12)",
  },
  icon: {
    width: scale(32),
    height: scale(32),
    marginBottom: verticalScale(4),
  },
  title: {
    fontSize: fontScale(13),
    color: asl.text.primary,
    fontFamily: fontFamily.medium,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: scale(6),
  },
});
