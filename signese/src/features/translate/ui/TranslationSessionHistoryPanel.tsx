import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ListRenderItemInfo,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { SessionTranslationEntry } from "@/src/features/translate/sessionHistory/useSessionTranslationHistory";
import { semanticColors, Spacing, Typography } from "@/src/theme";

type Props = {
  entries: SessionTranslationEntry[];
  onClearHistory: () => void;
  maxHeight: number;
  textScale: number;
};

function formatSessionTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "";
  }
}

const PANEL_HEADER_APPROX = 52;

export function TranslationSessionHistoryPanel({
  entries,
  onClearHistory,
  maxHeight,
  textScale,
}: Props) {
  const listRef = useRef<FlatList<SessionTranslationEntry>>(null);
  const listViewportHeight = Math.max(120, maxHeight - PANEL_HEADER_APPROX);

  useEffect(() => {
    if (entries.length === 0) {
      return;
    }
    const t = requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
    return () => cancelAnimationFrame(t);
  }, [entries.length]);

  const renderItem = ({ item }: ListRenderItemInfo<SessionTranslationEntry>) => (
    <View style={styles.item}>
      <View style={styles.itemHeader}>
        <Text style={[styles.orderBadge, { fontSize: 11 * textScale }]}>#{item.order}</Text>
        <Text style={[styles.timeText, { fontSize: 11 * textScale }]}>
          {formatSessionTime(item.createdAtMs)}
        </Text>
      </View>
      <Text style={[styles.labelMuted, { fontSize: 11 * textScale }]}>Detected</Text>
      <Text style={[styles.originalText, { fontSize: 14 * textScale }]} numberOfLines={4}>
        {item.originalText}
      </Text>
      <Text style={[styles.labelMuted, styles.labelSpaced, { fontSize: 11 * textScale }]}>
        Caption
      </Text>
      <Text style={[styles.translatedText, { fontSize: 14 * textScale }]} numberOfLines={6}>
        {item.translatedText}
      </Text>
    </View>
  );

  return (
    <View style={[styles.panel, { maxHeight }]}>
      <View style={styles.panelHeader}>
        <View style={styles.panelTitleRow}>
          <MaterialIcons name="history" size={18} color="#2C5D56" />
          <Text style={[styles.panelTitle, { fontSize: 14 * textScale }]}>This session</Text>
        </View>
        {entries.length > 0 ? (
          <Pressable
            onPress={onClearHistory}
            style={styles.clearBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear translation history for this session"
          >
            <Text style={[styles.clearBtnText, { fontSize: 12 * textScale }]}>Clear</Text>
          </Pressable>
        ) : null}
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyHint, { fontSize: 12 * textScale }]}>
          Each translation you run is listed here for this session only. Nothing is saved after you
          leave Translate.
        </Text>
      ) : (
        <FlatList
          ref={listRef}
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={[styles.list, { height: listViewportHeight }]}
          contentContainerStyle={styles.listContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          initialNumToRender={12}
          windowSize={7}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: Spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C8DDDA",
    backgroundColor: "#FAFDFC",
    overflow: "hidden",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: "#E3EFED",
    backgroundColor: "#EDF5F3",
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  panelTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: semanticColors.text.primary,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#E8F2F0",
    borderWidth: 1,
    borderColor: "#C9E1DC",
  },
  clearBtnText: {
    ...Typography.caption,
    color: "#2C5D56",
    fontWeight: "600",
  },
  emptyHint: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    lineHeight: 18,
  },
  list: {},
  listContent: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  item: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F0EE",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  orderBadge: {
    ...Typography.caption,
    fontWeight: "800",
    color: "#2C5D56",
  },
  timeText: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
  },
  labelMuted: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  labelSpaced: {
    marginTop: Spacing.xs,
  },
  originalText: {
    ...Typography.body,
    color: semanticColors.text.primary,
    fontWeight: "600",
    marginTop: 2,
  },
  translatedText: {
    ...Typography.body,
    color: semanticColors.text.primary,
    marginTop: 2,
  },
});
