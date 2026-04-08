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
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import SignOverlay from "../../src/components/SignOverlay";
import { SIGNS } from "../../src/features/dictionary/data/signs";
import {
  getSavedIds,
  toggleSavedId,
} from "../../src/features/dictionary/storage/saved.local";
import type { Sign } from "../../src/features/dictionary/types";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

const MINT = "#cfe9e6";
const TEAL = "#48b4a8";
const TEAL_DARK = "#2c9a8f";

export default function DictionaryScreen() {
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);

  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);

  useEffect(() => {
    getSavedIds().then((ids) => setSavedIds(new Set(ids)));
  }, []);

  const handleToggleSave = async (signId: string) => {
    const newSaved = await toggleSavedId(signId);
    setSavedIds((prev) => {
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
              avatar={headerProfileIcon.emoji}
              onPress={() => router.push("/(tabs)/account")}
            />
          </>
        }
      />

      <View style={styles.content}>
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

        <Text style={styles.sectionTitle}>Featured Signs</Text>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ paddingBottom: 70 }}
          renderItem={({ item }) => {
            const isSaved = savedIds.has(item.id);

            return (
              <Pressable
                style={[
                  styles.card,
                  item.source === "community" && styles.cardCommunity,
                ]}
                onPress={() => setSelectedSign(item)}
              >
                <View style={styles.mediaPlaceholder}>
                  <Text style={styles.mediaText}>media</Text>
                </View>

                <Text style={styles.cardWord} numberOfLines={1}>
                  {item.word}
                </Text>

                <Pressable
                  onPress={() => handleToggleSave(item.id)}
                  style={styles.saveBtn}
                >
                  <Text style={styles.saveIcon}>{isSaved ? "★" : "☆"}</Text>
                </Pressable>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No results.
            </Text>
          }
        />

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

        <SignOverlay
          visible={!!selectedSign}
          sign={selectedSign}
          onClose={() => setSelectedSign(null)}
        />
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
      fontSize: ts(20),
      color: "#ffd700",
    },

    emptyText: {
      textAlign: "center",
      marginTop: ms(20),
      color: "#566",
      fontSize: ts(16),
      lineHeight: ts(20),
    },

    bottomRow: {
      position: "absolute",
      left: Spacing.screenPadding,
      right: Spacing.screenPadding,
      bottom: ms(18),
      flexDirection: "row",
      gap: ms(12),
    },
    bottomBtn: {
      flex: 1,
      backgroundColor: TEAL,
      borderRadius: ms(18),
      paddingVertical: ms(14),
      alignItems: "center",
      justifyContent: "center",
    },
    bottomBtnText: {
      color: "white",
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "800",
    },
  });
};