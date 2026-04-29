import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightExtra?: React.ReactNode;
};

export function LearnFlowHeader({
  title,
  showBack = true,
  onBackPress,
  rightExtra,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {showBack ? (
        <Pressable
          onPress={onBackPress ?? (() => router.back())}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.72 }]}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}
      <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {rightExtra != null ? <View style={styles.right}>{rightExtra}</View> : <View style={styles.sidePlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 14,
    gap: 10,
    minHeight: 48,
  },
  iconBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: fontWeight.emphasis,
    textAlign: "center",
  },
  right: {
    minWidth: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
  },
  sidePlaceholder: {
    width: 36,
    height: 36,
  },
});
