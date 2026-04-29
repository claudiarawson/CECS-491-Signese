import { useTheme } from "@/src/contexts/ThemeContext";
import { fontWeight } from "@/src/theme";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const { colors } = useTheme();
  const p = Math.max(0, Math.min(100, percent));

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.top}>
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

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.sub, { color: colors.subtext }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>

      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${p}%`,
              backgroundColor: colors.primary,
            },
          ]}
        />
      </View>

      <Text style={[styles.pctText, { color: colors.subtext }]}>{p}%</Text>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [
          styles.cta,
          {
            backgroundColor: colors.primary,
          },
          pressed && { opacity: 0.9 },
        ]}
      >
        <Text style={styles.ctaText}>{ctaLabel} ▶</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
  },

  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },

  emojiWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  emoji: {
    fontSize: 24,
  },

  textBlock: {
    flex: 1,
  },

  title: {
    fontSize: 18,
    fontWeight: fontWeight.emphasis,
  },

  sub: {
    fontSize: 13,
    marginTop: 2,
  },

  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },

  fill: {
    height: "100%",
  },

  pctText: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: fontWeight.medium,
  },

  cta: {
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },

  ctaText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: fontWeight.emphasis,
  },
});