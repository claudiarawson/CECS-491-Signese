import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";

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
  rightExtra}: Props) {
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
          <MaterialIcons name="arrow-back" size={24} color={asl.text.primary} />
        </Pressable>
      ) : (
        <View style={styles.sidePlaceholder} />
      )}
      <Text style={styles.title} numberOfLines={1}>
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
    paddingTop: 4,
    paddingBottom: 14,
    gap: 10,
    minHeight: 48},
  iconBtn: {
    padding: 4},
  title: {
    flex: 1,
    fontSize: 22,
    color: asl.text.primary,
    fontWeight: fontWeight.emphasis,
    textAlign: "center"},
  right: {
    minWidth: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4},
  sidePlaceholder: {
    width: 36,
    height: 36}});
