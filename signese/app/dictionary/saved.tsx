import { AppShell, FilterChips, SearchBar, ToggleSwitch } from "@/src/components/asl";
import { DictionaryFooter, dictionaryChromePadBottom } from "@/src/components/DictionaryFooter";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontFamily, getDeviceDensity, moderateScale, Spacing } from "@/src/theme";
import { router, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import SignOverlay from "../../src/components/SignOverlay";
import { useDictionarySigns } from "../../src/features/dictionary/hooks/useDictionarySigns";
import { DictionarySignCard } from "../../src/features/dictionary/ui/DictionarySignCard";
import { prefetchDictionaryVideoUrl } from "../../src/services/dictionary/dictionarySigns.service";
import {
  getSavedIds,
  getSavedSnapshotMap,
  mergeSignWithSnapshot,
  toggleSavedId,
} from "../../src/features/dictionary/storage/saved.local";
import type { Sign, SignCategoryId } from "../../src/features/dictionary/types";
import {
  SIGN_CATEGORY_LABEL,
  SIGN_CATEGORY_ORDER,
} from "../../src/features/dictionary/signCategories";

const CATEGORY_CHIPS = SIGN_CATEGORY_ORDER.map((id) => ({
  id,
  label: SIGN_CATEGORY_LABEL[id],
}));

export default function SavedSignsScreen() {
  const { signs, loading, loadingMore, error, reload, loadMore } = useDictionarySigns();

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const listContentBottomPad = useMemo(() => dictionaryChromePadBottom(density), [density]);
  const styles = useMemo(() => createStyles(density), [density]);

  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<SignCategoryId[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, Sign>>({});
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);

  const reloadSaved = useCallback(() => {
    void Promise.all([getSavedIds(), getSavedSnapshotMap()]).then(([ids, snaps]) => {
      setSavedIds(new Set(ids));
      setSavedSnapshots(snaps);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reloadSaved();
    }, [reloadSaved])
  );

  const handleToggleSave = async (sign: Sign) => {
    const newSaved = await toggleSavedId(sign.id, sign);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (newSaved) next.add(sign.id);
      else next.delete(sign.id);
      return next;
    });
    setSavedSnapshots((prev) => {
      const next = { ...prev };
      if (newSaved) next[sign.id] = sign;
      else delete next[sign.id];
      return next;
    });
  };

  const toggleCategoryFilter = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id as SignCategoryId) ? prev.filter((x) => x !== id) : [...prev, id as SignCategoryId]
    );
  };

  const filtered: Sign[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows: Sign[] = [];
    for (const id of savedIds) {
      const catalog = signs.find((s) => s.id === id);
      const snap = savedSnapshots[id];
      const merged = mergeSignWithSnapshot(catalog, snap);
      if (merged) rows.push(merged);
    }
    return rows.filter((s) => {
      if (communityOnly && s.source !== "community") return false;
      if (selectedCategoryIds.length > 0) {
        const cats = s.categories ?? [];
        const matches = selectedCategoryIds.some((fid) => cats.includes(fid));
        if (!matches) return false;
      }
      if (!q) return true;
      return (
        s.word.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        (s.note && s.note.toLowerCase().includes(q))
      );
    });
  }, [query, communityOnly, selectedCategoryIds, savedIds, signs, savedSnapshots]);

  const header = (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.push("/(tabs)/dictionary")}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back to dictionary"
        style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={asl.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Saved signs
      </Text>
      <View style={styles.headerRight}>
        <Pressable
          onPress={() => router.push("/(tabs)/settings" as any)}
          hitSlop={8}
          accessibilityLabel="Open settings"
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="settings" size={24} color={asl.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/account")}
          hitSlop={8}
          accessibilityLabel="Open profile"
          style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
        >
          <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
        </Pressable>
      </View>
    </View>
  );

  return (
    <AppShell scroll={false} header={header}>
      <View style={styles.root}>
        <View style={styles.filtersBlock}>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search saved sign or word" />
          <View style={styles.toggleWrap}>
            <ToggleSwitch
              value={communityOnly}
              onValueChange={setCommunityOnly}
              label="Community signs only"
            />
          </View>
          <Text style={styles.categoryFilterLabel}>Categories</Text>
          <FilterChips
            items={CATEGORY_CHIPS}
            selectedIds={selectedCategoryIds}
            onToggle={toggleCategoryFilter}
          />
        </View>

        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
            <Pressable onPress={() => void reload()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Your saved signs</Text>

        {loading && signs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={asl.accentCyan} />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.signsList}
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 12 }}
            contentContainerStyle={{ paddingBottom: listContentBottomPad }}
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={7}
            removeClippedSubviews
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={asl.accentCyan} />
                  <Text style={styles.footerLoadingText}>Loading more signs…</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const merged = mergeSignWithSnapshot(item, savedSnapshots[item.id]) ?? item;
              const isItemSaved = savedIds.has(item.id);
              return (
                <DictionarySignCard
                  density={density}
                  item={item}
                  merged={merged}
                  isItemSaved={isItemSaved}
                  prefetch={() => prefetchDictionaryVideoUrl(merged)}
                  onPress={() => setSelectedSign(merged)}
                  onToggleSave={() => handleToggleSave(merged)}
                />
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {error
                  ? "Could not load signs."
                  : savedIds.size === 0
                    ? "No saved signs yet."
                    : "No matching saved signs."}
              </Text>
            }
          />
        )}

        <DictionaryFooter />

        <SignOverlay visible={!!selectedSign} sign={selectedSign} onClose={() => setSelectedSign(null)} />
      </View>
    </AppShell>
  );
}

const createStyles = (density: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.sm,
      gap: ms(8),
    },
    headerIconBtn: {
      padding: ms(4),
    },
    headerTitle: {
      flex: 1,
      color: asl.text.primary,
      fontSize: ms(22),
      fontFamily: fontFamily.heading,
      textAlign: "center",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(4),
      minWidth: ms(76),
      justifyContent: "flex-end",
    },
    root: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.xl - 4,
    },
    filtersBlock: {
      flexShrink: 0,
    },
    toggleWrap: {
      marginTop: ms(10),
    },
    signsList: {
      flex: 1,
      minHeight: 0,
    },
    categoryFilterLabel: {
      marginTop: ms(10),
      marginBottom: ms(6),
      fontSize: ms(12),
      fontWeight: "700",
      color: asl.accentCyan,
    },
    banner: {
      marginTop: ms(12),
      padding: ms(12),
      backgroundColor: "rgba(248, 113, 113, 0.2)",
      borderRadius: ms(12),
      gap: ms(8),
      borderWidth: 1,
      borderColor: "rgba(248, 113, 113, 0.35)",
    },
    bannerText: { color: "#FECACA", fontSize: ms(14), lineHeight: ms(18) },
    retryBtn: { alignSelf: "flex-start" },
    retryText: { color: asl.accentCyan, fontWeight: "700", fontSize: ms(14) },

    loadingBox: {
      paddingVertical: ms(40),
      alignItems: "center",
      gap: ms(12),
    },
    loadingText: { color: asl.text.secondary, fontSize: ms(15) },

    footerLoading: {
      paddingVertical: ms(16),
      alignItems: "center",
      gap: ms(8),
    },
    footerLoadingText: { color: asl.text.muted, fontSize: ms(13) },

    sectionTitle: {
      marginTop: ms(14),
      marginBottom: ms(10),
      fontSize: ms(20),
      fontWeight: "800",
      textAlign: "center",
      color: asl.text.primary,
    },

    emptyText: {
      textAlign: "center",
      marginTop: ms(20),
      color: asl.text.muted,
      fontSize: ms(16),
    },
  });
};
