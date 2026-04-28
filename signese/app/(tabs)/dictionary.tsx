import {
  HeaderActionButton,
  HeaderAvatarButton,
  ScreenContainer,
  ScreenHeader,
} from "@/src/components/layout";
import {
  Spacing,
  getDeviceDensity,
  moderateScale,
} from "@/src/theme";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { DictionaryFooter } from "@/src/components/DictionaryFooter";
import SignOverlay from "../../src/components/SignOverlay";
import { useDictionarySigns } from "../../src/features/dictionary/hooks/useDictionarySigns";
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
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

const MINT = "#cfe9e6";
const TEAL = "#48b4a8";
const TEAL_DARK = "#2c9a8f";

export default function DictionaryScreen() {
  const { signs, loading, loadingMore, error, reload, loadMore } = useDictionarySigns();
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const { q } = useLocalSearchParams<{ q?: string }>();

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);
  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);

  useEffect(() => {
    if (typeof q === "string" && q.trim().length > 0) {
      setQuery(q);
    }
  }, [q]);
  /** Empty = no category filter. Otherwise show signs that match any selected category (OR). */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<SignCategoryId[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [savedSnapshots, setSavedSnapshots] = useState<Record<string, Sign>>({});
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);

  useEffect(() => {
    void getSavedIds().then((ids) => setSavedIds(new Set(ids)));
    void getSavedSnapshotMap().then(setSavedSnapshots);
  }, []);

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

  const toggleCategoryFilter = (id: SignCategoryId) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filtered: Sign[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signs.filter((s) => {
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
  }, [query, communityOnly, signs, selectedCategoryIds]);

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Dictionary"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings" as any)}
            />
            <HeaderAvatarButton
              avatar={profile?.avatar}
              onPress={() => router.push("/(tabs)/account")}
            />
          </>
        }
      />

      <View style={styles.content}>
        <View style={styles.filtersBlock}>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Sign/Word"
              placeholderTextColor="#7b8a8b"
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
                <Text style={styles.clearText}>✕</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            onPress={() => setCommunityOnly((v) => !v)}
            style={[styles.togglePill, communityOnly && styles.togglePillOn]}
          >
            <Text
              style={[styles.toggleText, communityOnly && styles.toggleTextOn]}
            >
              {communityOnly ? "✓ " : ""}Community Signs
            </Text>
          </Pressable>

          <Text style={styles.categoryFilterLabel}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {SIGN_CATEGORY_ORDER.map((id) => {
              const on = selectedCategoryIds.includes(id);
              return (
                <Pressable
                  key={id}
                  onPress={() => toggleCategoryFilter(id)}
                  style={[styles.categoryChip, on && styles.categoryChipOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`${SIGN_CATEGORY_LABEL[id]}${on ? ", selected" : ""}`}
                >
                  <Text style={[styles.categoryChipText, on && styles.categoryChipTextOn]}>
                    {on ? "✓ " : ""}
                    {SIGN_CATEGORY_LABEL[id]}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>{error}</Text>
            <Pressable onPress={() => void reload()} style={styles.retryBtn}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Featured Signs</Text>

        {loading && signs.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={TEAL} />
            <Text style={styles.loadingText}>Loading dictionary…</Text>
          </View>
        ) : (
          <FlatList
            style={styles.signsList}
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ gap: 14 }}
            contentContainerStyle={{ paddingBottom: 70 }}
            initialNumToRender={12}
            maxToRenderPerBatch={16}
            windowSize={7}
            removeClippedSubviews
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.35}
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color={TEAL} />
                  <Text style={styles.footerLoadingText}>Loading more signs…</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => {
              const merged = mergeSignWithSnapshot(item, savedSnapshots[item.id]) ?? item;
              const isItemSaved = savedIds.has(item.id);
              const hasVideo = !!(
                merged.mediaUrl ||
                merged.storagePath ||
                merged.videoId
              );

              return (
                <Pressable
                  style={[styles.card, item.source === "community" && styles.cardCommunity]}
                  onPressIn={() => prefetchDictionaryVideoUrl(merged)}
                  onPress={() => setSelectedSign(merged)}
                >
                  <View style={styles.mediaPlaceholder}>
                    <Text style={styles.mediaText}>{hasVideo ? "▶ Video" : "—"}</Text>
                  </View>
                  <Text style={styles.cardWord} numberOfLines={1}>
                    {merged.word}
                  </Text>
                  <Pressable onPress={() => handleToggleSave(merged)} style={styles.saveBtn}>
                    <Text style={styles.saveIcon}>{isItemSaved ? "★" : "☆"}</Text>
                  </Pressable>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {error ? "Could not load signs." : "No results."}
              </Text>
            }
          />
        )}

        <DictionaryFooter />

        <SignOverlay visible={!!selectedSign} sign={selectedSign} onClose={() => setSelectedSign(null)} />
      </View>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
      minHeight: 0,
    },
    /** Keeps search + category chips from shrinking when FlatList scrolls. */
    filtersBlock: {
      flexShrink: 0,
    },
    signsList: {
      flex: 1,
      minHeight: 0,
    },
    searchWrap: {
      marginTop: ms(12),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#e6f4f2",
      borderRadius: ms(24),
      paddingHorizontal: ms(14),
      height: ms(46),
    },
    searchIcon: {
      fontSize: ts(18),
      marginRight: ms(8),
    },
    searchInput: {
      flex: 1,
      fontSize: ts(16),
      lineHeight: ts(20),
      color: "#111",
    },

    clearBtn: {
      marginLeft: ms(8),
    },
    clearText: {
      fontSize: ts(18),
      color: "#7b8a8b",
    },

    togglePill: {
      marginTop: ms(10),
      alignSelf: "flex-start",
      backgroundColor: "#e1f2f0",
      paddingHorizontal: ms(14),
      paddingVertical: ms(8),
      borderRadius: ms(18),
    },
    togglePillOn: {
      backgroundColor: TEAL_DARK,
    },
    toggleText: {
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
      color: TEAL_DARK,
    },
    toggleTextOn: {
      color: "white",
    },

    categoryFilterLabel: {
      marginTop: ms(10),
      marginBottom: ms(6),
      fontSize: ts(12),
      lineHeight: ts(16),
      fontWeight: "700",
      color: TEAL_DARK,
    },
    categoryScroll: {
      marginBottom: ms(8),
      flexShrink: 0,
      flexGrow: 0,
    },
    categoryScrollContent: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "nowrap",
      gap: ms(8),
      paddingVertical: ms(4),
      paddingRight: ms(8),
    },
    categoryChip: {
      flexShrink: 0,
      backgroundColor: MINT,
      borderWidth: 1,
      borderColor: TEAL,
      paddingHorizontal: ms(12),
      paddingVertical: ms(8),
      borderRadius: ms(18),
    },
    categoryChipOn: {
      backgroundColor: TEAL_DARK,
      borderColor: TEAL_DARK,
    },
    categoryChipText: {
      fontSize: ts(14),
      lineHeight: ts(18),
      fontWeight: "700",
      color: TEAL_DARK,
    },
    categoryChipTextOn: {
      color: "white",
    },

    banner: {
      marginTop: ms(12),
      padding: ms(12),
      backgroundColor: "#fde8e8",
      borderRadius: ms(12),
      gap: ms(8),
    },
    bannerText: { color: "#721c24", fontSize: ts(14), lineHeight: ts(18) },
    retryBtn: { alignSelf: "flex-start" },
    retryText: { color: TEAL_DARK, fontWeight: "700", fontSize: ts(14), lineHeight: ts(18) },

    loadingBox: {
      paddingVertical: ms(40),
      alignItems: "center",
      gap: ms(12),
    },
    loadingText: { color: "#566", fontSize: ts(15), lineHeight: ts(20) },

    footerLoading: {
      paddingVertical: ms(16),
      alignItems: "center",
      gap: ms(8),
    },
    footerLoadingText: { color: "#566", fontSize: ts(13), lineHeight: ts(18) },

    sectionTitle: {
      marginTop: ms(14),
      marginBottom: ms(10),
      fontSize: ts(20),
      lineHeight: ts(24),
      fontWeight: "800",
      textAlign: "center",
    },

    card: {
      flex: 1,
      backgroundColor: MINT,
      borderRadius: ms(22),
      padding: ms(12),
      marginBottom: ms(14),
    },
    cardCommunity: {
      backgroundColor: "#4ab3a7",
    },
    mediaPlaceholder: {
      height: ms(120),
      borderRadius: ms(18),
      backgroundColor: "rgba(255,255,255,0.75)",
      alignItems: "center",
      justifyContent: "center",
    },
    mediaText: {
      color: "#4d6",
      fontWeight: "700",
      fontSize: ts(14),
      lineHeight: ts(18),
    },
    cardWord: {
      marginTop: ms(10),
      fontSize: ts(22),
      lineHeight: ts(26),
      fontWeight: "900",
      textAlign: "center",
      color: "#111",
    },

    saveBtn: {
      position: "absolute",
      top: ms(8),
      right: ms(8),
      padding: ms(4),
    },
    saveIcon: {
      fontSize: ts(30),
      lineHeight: ts(34),
      color: "#ffd700",
    },

    emptyText: {
      textAlign: "center",
      marginTop: ms(20),
      color: "#566",
      fontSize: ts(16),
      lineHeight: ts(20),
    },
  });
};