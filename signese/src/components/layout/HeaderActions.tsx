import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { semanticColors } from "@/src/theme";
import { navigationTheme } from "@/src/theme/navigation";
import { useAuthUser } from "@/src/contexts/AuthUserContext";

type HeaderActionButtonProps = {
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  onPress: () => void;
  density?: number;
};

export function HeaderActionButton({
  iconName,
  onPress,
  density = 1,
}: HeaderActionButtonProps) {
  const size = 30 * density;
  return (
    <Pressable style={[styles.actionBtn, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress}>
      <MaterialIcons
        name={iconName}
        size={24 * density}
        color={navigationTheme.activeTint}
      />
    </Pressable>
  );
}

type HeaderAvatarButtonProps = {
  avatar?: string;
  onPress: () => void;
  density?: number;
};

export function HeaderAvatarButton({
  avatar = "🐨",
  onPress,
  density = 1,
}: HeaderAvatarButtonProps) {
  const { profile } = useAuthUser();
  const size = 36 * density;
  const avatarValue = profile?.avatar ?? avatar;
  return (
    <Pressable style={[styles.avatarBtn, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress}>
      <Text style={[styles.avatarText, { fontSize: 20 * density }]}>{avatarValue}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    backgroundColor: "#E8F6F2",
    borderWidth: 1,
    borderColor: "#D4ECE6",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarBtn: {
    backgroundColor: "#EDE7F7",
    borderWidth: 1,
    borderColor: "#E2D8F2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    lineHeight: 18,
  },
});
