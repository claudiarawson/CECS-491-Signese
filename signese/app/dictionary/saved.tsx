import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import type { Sign } from "../../src/features/dictionary/types";
import { getSavedIds } from "../../src/features/dictionary/storage/saved.local";
import SignOverlay from "../../src/components/SignOverlay";
import { useDictionarySigns } from "../../src/features/dictionary/hooks/useDictionarySigns";
import { prefetchDictionaryVideoUrl } from "../../src/services/dictionary/dictionarySigns.service";

const TEAL = "#48b4a8";
const TEAL_DARK = "#2c9a8f";

export default function SavedSignsScreen() {
  const { signs, loading, error, reload } = useDictionarySigns();
  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);

  useEffect(() => {
    getSavedIds().then((ids) => setSavedIds(new Set(ids)));
  }, []);

  const filtered: Sign[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return signs.filter((s) => {
      if (!savedIds.has(s.id)) return false;
      if (communityOnly && s.source !== "community") return false;
      if (!q) return true;
      return (
        s.word.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        (s.note && s.note.toLowerCase().includes(q))
      );
    });
  }, [query, communityOnly, savedIds, signs]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.push("/(tabs)/dictionary")} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Saved Signs</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconBtn}>
            <Text>⚙️</Text>
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Text>🙂</Text>
          </Pressable>
        </View>
      </View>

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
        <Text style={[styles.toggleText, communityOnly && styles.toggleTextOn]}>
          {communityOnly ? "✓ " : ""}Community Signs
        </Text>
      </Pressable>

      {error ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{error}</Text>
          <Pressable onPress={() => void reload()}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>Saved Signs</Text>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ paddingBottom: 110 }}
          renderItem={({ item }) => {
            const hasVideo = !!(item.mediaUrl || item.storagePath || item.videoId);
            return (
            <Pressable
              style={[styles.card, item.source === "community" && styles.cardCommunity]}
              onPressIn={() => prefetchDictionaryVideoUrl(item)}
              onPress={() => setSelectedSign(item)}
            >
              <View style={styles.mediaPlaceholder}>
                <Text style={styles.mediaText}>{hasVideo ? "▶ Video" : "—"}</Text>
              </View>
              <Text style={styles.cardWord} numberOfLines={1}>
                {item.word}
              </Text>
            </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#566" }}>
              {savedIds.size === 0 ? "No saved signs yet." : "No matching saved signs."}
            </Text>
          }
        />
      )}

      <View style={styles.bottomRow}>
        <Pressable style={styles.bottomBtn} onPress={() => router.push("/dictionary/add-dialect")}>
          <Text style={styles.bottomBtnText}>＋ Add Sign</Text>
        </Pressable>

        <Pressable style={styles.bottomBtn} onPress={() => router.push("/dictionary/saved")}>
          <Text style={styles.bottomBtnText}>≡ Saved Signs</Text>
        </Pressable>
      </View>

      <SignOverlay visible={!!selectedSign} sign={selectedSign} onClose={() => setSelectedSign(null)} />
    </View>
  );
}

const MINT = "#cfe9e6";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4fbfa", paddingHorizontal: 18, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef7f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  backText: { fontSize: 20, color: "#111" },
  title: { fontSize: 32, fontWeight: "800", color: "#111", flex: 1 },
  headerIcons: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eef7f6", alignItems: "center", justifyContent: "center" },

  searchWrap: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f4f2",
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 46,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#111" },
  clearBtn: { marginLeft: 8 },
  clearText: { fontSize: 18, color: "#7b8a8b" },

  togglePill: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#e1f2f0",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  togglePillOn: { backgroundColor: TEAL_DARK },
  toggleText: { fontSize: 16, fontWeight: "700", color: TEAL_DARK },
  toggleTextOn: { color: "white" },

  banner: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fde8e8",
    borderRadius: 12,
    gap: 8,
  },
  bannerText: { color: "#721c24", fontSize: 14 },
  retryText: { color: TEAL_DARK, fontWeight: "700" },

  loadingBox: { paddingVertical: 32, alignItems: "center", gap: 8 },
  loadingText: { color: "#566" },

  sectionTitle: { marginTop: 14, marginBottom: 10, fontSize: 20, fontWeight: "800", textAlign: "center" },

  card: {
    flex: 1,
    backgroundColor: MINT,
    borderRadius: 22,
    padding: 12,
    marginBottom: 14,
  },
  cardCommunity: {
    backgroundColor: "#4ab3a7",
  },
  mediaPlaceholder: {
    height: 120,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: { color: "#4d6", fontWeight: "700" },
  cardWord: { marginTop: 10, fontSize: 22, fontWeight: "900", textAlign: "center", color: "#111" },

  bottomRow: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 18,
    flexDirection: "row",
    gap: 12,
  },
  bottomBtn: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnText: { color: "white", fontSize: 16, fontWeight: "800" },
});
