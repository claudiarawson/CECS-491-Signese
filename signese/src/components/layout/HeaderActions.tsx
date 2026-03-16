import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Sizes, Spacing, moderateScale, semanticColors } from "@/src/theme";
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
  const size = Sizes.avatarSmall * density;
  return (
    <Pressable style={[styles.actionBtn, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress}>
      <MaterialIcons
        name={iconName}
        size={moderateScale(18) * density}
        color={semanticColors.text.secondary}
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
  const size = Sizes.avatarSmall * density;
  const avatarValue = profile?.avatar ?? avatar;
  return (
    <Pressable style={[styles.avatarBtn, { width: size, height: size, borderRadius: size / 2 }]} onPress={onPress}>
      <Text style={[styles.avatarText, { fontSize: moderateScale(16) * density }]}>{avatarValue}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    backgroundColor: "#F2F7F8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  avatarBtn: {
    backgroundColor: "#EDE7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    lineHeight: moderateScale(18),
  },
});
