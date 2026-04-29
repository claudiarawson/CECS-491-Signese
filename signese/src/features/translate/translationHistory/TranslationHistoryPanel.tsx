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
import { EmptyState } from "@/src/components/ui";
import { AppShell, Radius, semanticColors, Spacing, Typography } from "@/src/theme";
import { Surfaces } from "@/src/theme/surfaces";
import { asl } from "@/src/theme/aslConnectTheme";
import type { TranslationHistoryItem } from "./types";
import { TranslationHistoryItemCard } from "./TranslationHistoryItemCard";

const HEADER_BLOCK = 76;

type Props = {
  items: TranslationHistoryItem[];
  onClear: () => void;
  onReuse?: (item: TranslationHistoryItem) => void;
  onDictionary?: (item: TranslationHistoryItem) => void;
  onDelete?: (item: TranslationHistoryItem) => void;
  onReportItem?: (item: TranslationHistoryItem) => void;
  /** Stacked under main content on phones; fixed width column on wide layouts. */
  variant: "stacked" | "sidebar";
  /** Viewport height for the list (stacked mode). Ignored for sidebar when flex is used. */
  listMaxHeight: number;
  textScale: number;
  appearance?: "light" | "dark";
  /** When true, subtitle reflects on-device persistence. */
  keepHistoryOnDevice?: boolean;
};

const darkPanel = StyleSheet.create({
  panel: {
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  header: {
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  title: { color: asl.text.primary },
  subtitle: { color: asl.text.muted },
  clearBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: asl.glass.border,
  },
  clearBtnText: { color: asl.accentCyan },
});

export function TranslationHistoryPanel({
  items,
  onClear,
  onReuse,
  onDictionary,
  onDelete,
  onReportItem,
  variant,
  listMaxHeight,
  textScale,
  appearance = "light",
  keepHistoryOnDevice = false,
}: Props) {
  const listRef = useRef<FlatList<TranslationHistoryItem>>(null);
  const d = appearance === "dark";

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    const t = requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
    return () => cancelAnimationFrame(t);
  }, [items.length]);

  const renderItem = ({ item, index }: ListRenderItemInfo<TranslationHistoryItem>) => (
    <TranslationHistoryItemCard
      item={item}
      isNewest={index === 0}
      textScale={textScale}
      onDictionary={onDictionary}
      onDelete={onDelete}
      onReport={onReportItem}
      appearance={appearance}
    />
  );

  const listViewport =
    variant === "sidebar"
      ? Math.max(200, listMaxHeight - HEADER_BLOCK)
      : Math.max(120, listMaxHeight - HEADER_BLOCK);

  const panelStyle = [
    styles.panel,
    variant === "sidebar" && styles.panelSidebar,
    variant === "stacked" && styles.panelStacked,
    d && darkPanel.panel,
  ];

  const historySubtitle = keepHistoryOnDevice
    ? "Saved on this device"
    : "This session only · not saved";

  return (
    <View style={panelStyle}>
      <View style={[styles.panelHeader, d && darkPanel.header]}>
        <View style={styles.titleBlock}>
          <View style={styles.panelTitleRow}>
            <MaterialIcons name="history" size={20} color={d ? asl.accentCyan : "#214F46"} />
            <Text
              style={[
                styles.panelTitle,
                d && darkPanel.title,
                { fontSize: 15 * textScale },
              ]}
            >
              Recent translations
            </Text>
          </View>
          <Text style={[styles.subtitle, d && darkPanel.subtitle, { fontSize: 12 * textScale }]}>
            {historySubtitle}
          </Text>
        </View>
        {items.length > 0 ? (
          <Pressable
            onPress={onClear}
            style={({ pressed }) => [
              styles.clearBtn,
              d && darkPanel.clearBtn,
              pressed && styles.clearBtnPressed,
            ]}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear translation history for this session"
          >
            <Text style={[styles.clearBtnText, d && darkPanel.clearBtnText, { fontSize: 12 * textScale }]}>
              Clear
            </Text>
          </Pressable>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          {d ? (
            <View style={styles.emptyDark} accessibilityRole="text">
              <Text style={styles.emptyDarkTitle}>No translations yet</Text>
              <Text style={styles.emptyDarkDesc}>
                Record a clip and infer — results show up here.
                {keepHistoryOnDevice ? " They can stay on this device when the toggle is on." : ""}
              </Text>
            </View>
          ) : (
            <EmptyState
              title="No translations yet"
              description="Run Record Clip & infer — each result appears here automatically for this session."
            />
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          style={variant === "sidebar" ? [styles.list, styles.listSidebar] : [styles.list, { height: listViewport }]}
          contentContainerStyle={styles.listContent}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
          initialNumToRender={14}
          windowSize={8}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Surfaces.hairline,
    backgroundColor: Surfaces.card,
    overflow: "hidden",
  },
  panelStacked: {
    marginTop: Spacing.md,
    width: "100%",
  },
  panelSidebar: {
    width: AppShell.sidebarWidth,
    maxWidth: "100%",
    flex: 1,
    minHeight: 0,
    alignSelf: "stretch",
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Surfaces.hairline,
    backgroundColor: Surfaces.cardMuted,
    gap: Spacing.sm,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
    fontWeight: "700",
  },
  subtitle: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: 2,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Surfaces.card,
    borderWidth: 1,
    borderColor: Surfaces.border,
  },
  clearBtnPressed: {
    backgroundColor: Surfaces.pressed,
  },
  clearBtnText: {
    ...Typography.caption,
    color: "#214F46",
    fontWeight: "700",
  },
  emptyWrap: {
    padding: Spacing.sm,
  },
  list: {},
  listSidebar: {
    flex: 1,
    minHeight: 120,
  },
  listContent: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  emptyDark: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: "center",
  },
  emptyDarkTitle: {
    ...Typography.sectionTitle,
    color: asl.text.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyDarkDesc: {
    ...Typography.caption,
    color: asl.text.muted,
    textAlign: "center",
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
});
