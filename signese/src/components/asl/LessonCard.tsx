import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type Props = {
  title: string;
  subtitle?: string;
  emoji: string;
  onPress: () => void;
  status: "locked" | "in_progress" | "complete";
  rightDetail?: string;
  disabled?: boolean;
};

export function LessonCard({ title, subtitle, emoji, onPress, status, rightDetail, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        (pressed || disabled) && { opacity: disabled ? 0.55 : 0.9 },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {rightDetail ? <Text style={styles.detail}>{rightDetail}</Text> : null}
        {status === "locked" ? (
          <MaterialIcons name="lock" size={20} color={asl.text.muted} />
        ) : status === "complete" ? (
          <MaterialIcons name="check-circle" size={22} color="#4ADE80" />
        ) : (
          <MaterialIcons name="chevron-right" size={22} color={asl.text.secondary} />
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
    borderRadius: asl.radius.lg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 14,
    marginBottom: 10,
  },
  left: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1, minWidth: 0 },
  emojiWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 20 },
  title: { color: asl.text.primary, fontSize: 16, fontFamily: fontFamily.heading },
  sub: { color: asl.text.muted, fontSize: 12, marginTop: 2, fontFamily: fontFamily.body },
  right: { flexDirection: "row", alignItems: "center", gap: 8 },
  detail: { color: asl.text.secondary, fontSize: 12, fontFamily: fontFamily.medium },
});
