import React from "react";
import { View, Text, Pressable, StyleSheet, type TextStyle, type ViewStyle } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

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
  return (
    <View style={[styles.row, containerStyle]}>
      <View style={styles.left}>
        <Text style={[styles.title, titleStyle]} numberOfLines={1}>
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
          <MaterialIcons name="settings" size={24} color={asl.text.secondary} />
        </Pressable>
        <Pressable
          onPress={onProfile}
          hitSlop={8}
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flex: 1, minWidth: 0 },
  title: {
    color: asl.text.primary,
    fontSize: 24,
    letterSpacing: 0.2,
    fontFamily: fontFamily.heading,
  },
  right: { flexDirection: "row", alignItems: "center", gap: 4 },
  iconBtn: { padding: 4 },
});
