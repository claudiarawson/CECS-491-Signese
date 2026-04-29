import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily } from "@/src/theme";

type Props = {
  title: string;
  percent: number;
  onContinue: () => void;
  ctaLabel?: string;
  subtitle?: string;
  emoji: string;
};

export function ProgressCard({
  title,
  percent,
  onContinue,
  ctaLabel = "Continue",
  subtitle,
  emoji,
}: Props) {
  const p = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.emojiWrap}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.track}>
        <LinearGradient
          colors={["#F472B6", "#A855F7"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.fill, { width: `${p}%` }]}
        />
      </View>
      <Text style={styles.pctText}>{p}%</Text>
      <Pressable onPress={onContinue} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
        <Text style={styles.ctaText}>{ctaLabel} ▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: asl.radius.lg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    marginTop: 8,
  },
  top: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 24 },
  textBlock: { flex: 1 },
  title: { color: asl.text.primary, fontSize: 18, fontFamily: fontFamily.heading },
  sub: { color: asl.text.muted, fontSize: 13, marginTop: 2, fontFamily: fontFamily.body },
  track: { height: 8, borderRadius: 4, backgroundColor: "rgba(0,0,0,0.3)", overflow: "hidden" },
  fill: { height: "100%" },
  pctText: { color: asl.text.secondary, fontSize: 12, marginTop: 6, fontFamily: fontFamily.medium },
  cta: {
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: "rgba(244, 114, 182, 0.25)",
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.4)",
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaText: { color: asl.text.primary, fontSize: 15, fontFamily: fontFamily.heading },
});
