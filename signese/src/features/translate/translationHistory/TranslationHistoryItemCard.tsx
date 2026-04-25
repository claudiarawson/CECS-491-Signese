import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { TranslationHistoryItem } from "./types";
import { Radius, semanticColors, Spacing, Typography } from "@/src/theme";
import { Surfaces } from "@/src/theme/surfaces";

type Props = {
  item: TranslationHistoryItem;
  isNewest: boolean;
  textScale: number;
  onReuse?: (item: TranslationHistoryItem) => void;
  onReport?: (item: TranslationHistoryItem) => void;
};

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

export function TranslationHistoryItemCard({ item, isNewest, textScale, onReuse, onReport }: Props) {
  return (
    <View style={[styles.card, isNewest && styles.cardNewest]}>
      <View style={styles.rowTop}>
        <Text style={[styles.langPair, { fontSize: 10 * textScale }]} numberOfLines={1}>
          {item.sourceLanguage} → {item.targetLanguage}
        </Text>
        <Text style={[styles.time, { fontSize: 10 * textScale }]}>{formatTimestamp(item.createdAt)}</Text>
      </View>
      <View style={styles.badgeRow}>
        <Text style={[styles.seq, { fontSize: 10 * textScale }]}>#{item.sequence}</Text>
        {isNewest ? (
          <View style={styles.newPill}>
            <Text style={styles.newPillText}>Latest</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.kicker, { fontSize: 10 * textScale }]}>Detected</Text>
      <Text style={[styles.original, { fontSize: 13 * textScale }]} numberOfLines={4}>
        {item.originalText}
      </Text>
      <Text style={[styles.kicker, styles.kickerSpaced, { fontSize: 10 * textScale }]}>
        Caption
      </Text>
      <Text style={[styles.translated, { fontSize: 13 * textScale }]} numberOfLines={6}>
        {item.translatedText}
      </Text>

      {onReuse || onReport ? (
        <View style={styles.actionRow}>
          {onReuse ? (
            <Pressable
              onPress={() => onReuse(item)}
              style={({ pressed }) => [styles.actionBtn, styles.actionPrimary, pressed && styles.actionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Use this caption in the translator"
            >
              <Text style={[styles.actionBtnText, { fontSize: 12 * textScale }]}>Use caption</Text>
            </Pressable>
          ) : null}
          {onReport ? (
            <Pressable
              onPress={() => onReport(item)}
              style={({ pressed }) => [styles.actionBtn, styles.actionSecondary, pressed && styles.actionPressed]}
              accessibilityRole="button"
              accessibilityLabel="Report incorrect translation for this result"
            >
              <MaterialIcons name="flag" size={16} color="#214F46" />
              <Text style={[styles.actionBtnTextSecondary, { fontSize: 12 * textScale }]}>Report</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surfaces.border,
    backgroundColor: Surfaces.card,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardNewest: {
    borderColor: Surfaces.borderStrong,
    backgroundColor: Surfaces.accentWash,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  actionPrimary: {
    backgroundColor: "#214F46",
    borderColor: "#1A3F38",
  },
  actionSecondary: {
    backgroundColor: Surfaces.card,
    borderColor: Surfaces.borderStrong,
  },
  actionPressed: {
    opacity: 0.88,
  },
  actionBtnText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  actionBtnTextSecondary: {
    ...Typography.caption,
    color: "#214F46",
    fontWeight: "700",
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.xs,
    marginBottom: 4,
  },
  langPair: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontWeight: "600",
    flex: 1,
  },
  time: {
    ...Typography.caption,
    color: semanticColors.text.tertiary,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  seq: {
    ...Typography.caption,
    fontWeight: "800",
    color: "#1D4B43",
  },
  newPill: {
    backgroundColor: "#214F46",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  newPillText: {
    ...Typography.caption,
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  kicker: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  kickerSpaced: {
    marginTop: Spacing.xs,
  },
  original: {
    ...Typography.body,
    color: semanticColors.text.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  translated: {
    ...Typography.body,
    color: semanticColors.text.primary,
    marginTop: 2,
  },
});
