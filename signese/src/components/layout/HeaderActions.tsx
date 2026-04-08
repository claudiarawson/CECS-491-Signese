import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getProfileIconById } from "@/src/features/account/types";

export function HeaderActionButton({
  iconName,
  onPress,
}: {
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn}>
      <MaterialIcons name={iconName} size={20} color="#4B5563" />
    </Pressable>
  );
}

export function HeaderAvatarButton({
  avatar,
  onPress,
}: {
  avatar?: string;
  onPress?: () => void;
}) {
  const looksLikeEmoji = typeof avatar === "string" && avatar.length <= 3;
  const resolvedAvatar = looksLikeEmoji ? avatar : getProfileIconById(avatar).emoji;

  return (
    <Pressable onPress={onPress} style={styles.avatarButton}>
      <Text style={styles.avatarEmoji}>{resolvedAvatar}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avatarButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E6DDF0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avatarEmoji: {
    fontSize: 18,
  },
});