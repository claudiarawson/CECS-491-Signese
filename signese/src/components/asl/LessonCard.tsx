import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  subtitle?: string;
  emoji: string;
  onPress: () => void;
  status: "locked" | "in_progress" | "complete";
  rightDetail?: string;
  disabled?: boolean;
};

export function LessonCard({
  title,
  subtitle,
  emoji,
  onPress,
  status,
  rightDetail,
  disabled,
}: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        (pressed || disabled) && { opacity: disabled ? 0.55 : 0.9 },
      ]}
    >
      <View style={styles.left}>
        <View
          style={[
            styles.emojiWrap,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </View>

        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: colors.subtext }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.right}>
        {rightDetail ? (
          <Text style={[styles.detail, { color: colors.subtext }]}>
            {rightDetail}
          </Text>
        ) : null}

        {status === "locked" ? (
          <MaterialIcons name="lock" size={20} color={colors.subtext} />
        ) : status === "complete" ? (
          <MaterialIcons name="check-circle" size={22} color="#4ADE80" />
        ) : (
          <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  emoji: {
    fontSize: 20,
  },

  title: {
    fontSize: 16,
    fontWeight: fontWeight.emphasis,
  },

  sub: {
    fontSize: 12,
    marginTop: 2,
  },

  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detail: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
  },
});