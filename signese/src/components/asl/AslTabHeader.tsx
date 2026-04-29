import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from "react-native";

type Props = {
  title: string;
  onSettings?: () => void;
  onProfile?: () => void;
  rightExtra?: React.ReactNode;
  titleStyle?: TextStyle;
  containerStyle?: ViewStyle;
};

export function AslTabHeader({
  title,
  onSettings = () => router.push("/(tabs)/settings" as any),
  onProfile = () => router.push("/(tabs)/account" as any),
  rightExtra,
  titleStyle,
  containerStyle,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, containerStyle]}>
      <View style={styles.left}>
        <Text style={[styles.title, { color: colors.text }, titleStyle]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.right}>
        {rightExtra}

        <Pressable
          onPress={onSettings}
          hitSlop={8}
          accessibilityLabel="Open settings"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="settings" size={24} color={colors.text} />
        </Pressable>

        <Pressable
          onPress={onProfile}
          hitSlop={8}
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="account-circle" size={26} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 4,
    /** Safe area (Dynamic Island / notch) is applied by AppShell `SafeAreaView`; keep a tight strip below it */
    paddingTop: 6,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 24,
    letterSpacing: 0.2,
    fontWeight: fontWeight.emphasis,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 4,
  },
});