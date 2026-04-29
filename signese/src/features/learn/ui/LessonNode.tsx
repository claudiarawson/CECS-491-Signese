import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { scale, verticalScale, fontScale } from "@/src/theme/responsive";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";
import { type ThemeColors, useTheme } from "@/src/contexts/ThemeContext";

type LessonNodeProps = {
  title: string;
  icon?: any;
  active?: boolean;
  completed?: boolean;
  onPress?: () => void;
};

export function LessonNode({ title, icon, active, completed }: LessonNodeProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    circle: {
      width: scale(72),
      height: scale(72),
      borderRadius: scale(36),
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      ...asl.shadow.card,
      marginBottom: verticalScale(12),
    },
    circleActive: {
      borderColor: colors.accentBlue,
      backgroundColor: `${colors.accentBlue}1F`,
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
      color: colors.text,
      fontWeight: fontWeight.medium,
      textAlign: "center",
      paddingHorizontal: scale(6),
    },
  });
