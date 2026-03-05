import React, { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { SIGNS } from "../../src/features/dictionary/data/signs";
import type { Sign } from "../../src/features/dictionary/types";
import SignOverlay from "../../src/features/dictionary/ui/SignOverlay";

export default function DictionaryScreen() {
  const [query, setQuery] = useState("");
  const [communityOnly, setCommunityOnly] = useState(false);

  // overlay state
  const [selectedSign, setSelectedSign] = useState<Sign | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SIGNS.filter((s) => {
      if (communityOnly && s.source !== "community") return false;
      if (!q) return true;
      return (
        s.word.toLowerCase().includes(q) ||
        s.definition.toLowerCase().includes(q) ||
        s.howToSign.toLowerCase().includes(q) ||
        (s.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [query, communityOnly]);

  const openOverlay = (sign: Sign) => {
    setSelectedSign(sign);
    setOverlayVisible(true);
  };

  const closeOverlay = () => {
    setOverlayVisible(false);
    setSelectedSign(null);
  };

  return (
    <View style={{ flex: 1, padding: 18, backgroundColor: "#f4fbfa" }}>
      {/* top UI omitted for brevity... */}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 14 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openOverlay(item)}
            style={{
              flex: 1,
              backgroundColor: item.source === "community" ? "#4ab3a7" : "#cfe9e6",
              borderRadius: 22,
              padding: 12,
              marginBottom: 14,
            }}
          >
            <View
              style={{
                height: 120,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.75)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontWeight: "800", color: "#2c9a8f" }}>media</Text>
            </View>

            <Text
              style={{
                marginTop: 10,
                fontSize: 22,
                fontWeight: "900",
                textAlign: "center",
                color: "#0b0b0b",
              }}
              numberOfLines={1}
            >
              {item.word}
            </Text>
          </Pressable>
        )}
      />

      <SignOverlay
        visible={overlayVisible}
        sign={selectedSign}
        onClose={closeOverlay}
        // later: add isSaved + onToggleSave here
      />
    </View>
  );
}