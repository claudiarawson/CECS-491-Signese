import React from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import type { Sign } from "../types";

type Props = {
  visible: boolean;
  sign: Sign | null;
  onClose: () => void;

  // Optional: wire these later (Firestore saved signs)
  isSaved?: boolean;
  onToggleSave?: () => void;
};

export default function SignOverlay({
  visible,
  sign,
  onClose,
  isSaved,
  onToggleSave,
}: Props) {
  if (!sign) return null;

  const isCommunity = sign.source === "community";

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* dim background */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* card */}
      <View style={[styles.card, isCommunity && styles.cardCommunity]}>
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>
            {sign.word}
          </Text>

          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </View>

        {/* media placeholder (optional) */}
        <View style={styles.mediaBox}>
          <Text style={styles.mediaText}>
            {sign.mediaUrl ? "media loaded" : "media placeholder"}
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>Definition</Text>
          <Text style={styles.bodyText}>{sign.definition}</Text>

          <Text style={styles.sectionLabel}>How to sign</Text>
          <Text style={styles.bodyText}>{sign.howToSign}</Text>

          {!!sign.note && (
            <>
              <Text style={styles.sectionLabel}>Note</Text>
              <Text style={styles.bodyText}>{sign.note}</Text>
            </>
          )}
        </ScrollView>

        {/* bottom actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={onClose}>
            <Text style={styles.actionText}>Back</Text>
          </Pressable>

          {onToggleSave && (
            <Pressable
              style={[styles.actionBtn, styles.saveBtn]}
              onPress={onToggleSave}
            >
              <Text style={[styles.actionText, styles.saveText]}>
                {isSaved ? "Unsave" : "Save"}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },

  card: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 90,
    bottom: 90,
    backgroundColor: "#d7efec", // featured light mint
    borderRadius: 28,
    padding: 16,
  },
  cardCommunity: {
    backgroundColor: "#4ab3a7", // community darker
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 28,
    fontWeight: "900",
    color: "#0b0b0b",
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: { fontSize: 18, fontWeight: "900" },

  mediaBox: {
    marginTop: 12,
    height: 160,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  mediaText: { fontWeight: "800", color: "#2c9a8f" },

  content: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "900",
    color: "#0b0b0b",
  },
  bodyText: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 20,
    color: "#1a1a1a",
  },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { fontWeight: "900", fontSize: 16, color: "#0b0b0b" },

  saveBtn: {
    backgroundColor: "#2c9a8f",
  },
  saveText: { color: "white" },
});