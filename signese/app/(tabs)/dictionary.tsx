import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { router } from "expo-router";
import { SIGNS } from "../../src/features/dictionary/data/signs";
import type { Sign } from "../../src/features/dictionary/types";
import { getSavedIds, toggleSavedId } from "../../src/features/dictionary/storage/saved.local";
import SignOverlay from "../../src/components/SignOverlay";

export default function DictionaryScreen() {
  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);

  useEffect(() => {
    getSavedIds().then(ids => setSavedIds(new Set(ids)));
  }, []);

  const handleToggleSave = async (signId: string) => {
    const newSaved = await toggleSavedId(signId);
    setSavedIds(prev => {
      const newSet = new Set(prev);
      if (newSaved) {
        newSet.add(signId);
      } else {
        newSet.delete(signId);
      }
      return newSet;
    });
  };

  const filtered: Sign[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SIGNS.filter((s) => {
      if (communityOnly && s.source !== "community") return false;
      if (!q) return true;
      return (
        s.word.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q)
      );
    });
  }, [query, communityOnly]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Dictionary</Text>
        <View style={styles.headerIcons}>
          <Pressable style={styles.iconBtn}><Text>⚙️</Text></Pressable>
          <Pressable style={styles.iconBtn}><Text>🙂</Text></Pressable>
        </View>
      </View>

      {/* Search */}
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

      {/* Community toggle */}
      <Pressable
        onPress={() => setCommunityOnly((v) => !v)}
        style={[styles.togglePill, communityOnly && styles.togglePillOn]}
      >
        <Text style={[styles.toggleText, communityOnly && styles.toggleTextOn]}>
          {communityOnly ? "✓ " : ""}Community Signs
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Featured Signs</Text>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={{ paddingBottom: 110 }}
        renderItem={({ item }) => {
          const isSaved = savedIds.has(item.id);
          return (
            <Pressable
              style={[styles.card, item.source === "community" && styles.cardCommunity]}
              onPress={() => setSelectedSign(item)}
            >
              <View style={styles.mediaPlaceholder}>
                <Text style={styles.mediaText}>media</Text>
              </View>
              <Text style={styles.cardWord} numberOfLines={1}>
                {item.word}
              </Text>
              <Pressable onPress={() => handleToggleSave(item.id)} style={styles.saveBtn}>
                <Text style={styles.saveIcon}>{isSaved ? '★' : '☆'}</Text>
              </Pressable>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20, color: "#566" }}>
            No results.
          </Text>
        }
      />

      {/* Bottom buttons */}
      <View style={styles.bottomRow}>
        <Pressable
          style={styles.bottomBtn}
          onPress={() => router.push("/dictionary/add-dialect")}
        >
          <Text style={styles.bottomBtnText}>＋ Add Sign</Text>
        </Pressable>

        <Pressable
          style={styles.bottomBtn}
          onPress={() => router.push("/dictionary/saved")}
        >
          <Text style={styles.bottomBtnText}>≡ Saved Signs</Text>
        </Pressable>
      </View>

      <SignOverlay visible={!!selectedSign} sign={selectedSign} onClose={() => setSelectedSign(null)} />
    </View>
  );
}

const MINT = "#cfe9e6";
const TEAL = "#48b4a8";
const TEAL_DARK = "#2c9a8f";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4fbfa", paddingHorizontal: 18, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 32, fontWeight: "800", color: "#111" },
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

  saveBtn: { position: 'absolute', top: 8, right: 8, padding: 4 },
  saveIcon: { fontSize: 20, color: '#ffd700' },

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