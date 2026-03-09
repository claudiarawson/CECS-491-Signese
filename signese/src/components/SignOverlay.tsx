import React, { useState, useEffect } from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView } from "react-native";
import type { Sign } from "../features/dictionary/types";
import { toggleSavedId, isSaved } from "../features/dictionary/storage/saved.local";

interface SignOverlayProps {
  visible: boolean;
  sign: Sign | null;
  onClose(): void;
}

export default function SignOverlay({ visible, sign, onClose }: SignOverlayProps) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (visible && sign) {
      isSaved(sign.id).then(setSaved);
    }
  }, [visible, sign?.id]);

  const handleToggleSave = async () => {
    if (!sign) return;
    const newSaved = await toggleSavedId(sign.id);
    setSaved(newSaved);
  };

  if (!sign) return null;

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose} animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.content}>
          {/* Close Button */}
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          {/* Save State */}
          <Pressable onPress={handleToggleSave} style={styles.saveStateContainer}>
            <Text style={styles.saveStateIcon}>{saved ? "★" : "☆"}</Text>
            <Text style={styles.saveStateText}>{saved ? "Saved" : "Not saved"}</Text>
          </Pressable>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Big Word Title */}
            <Text style={styles.word}>{sign.word}</Text>

            {/* Image/Media Preview */}
            <View style={styles.mediaSection}>
              <View style={styles.media}>
                <Text style={styles.mediaText}>media</Text>
              </View>
            </View>

            {/* Definition */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Definition</Text>
              <View style={styles.mintBlock}>
                <Text style={styles.mintText}>{sign.definition}</Text>
              </View>
            </View>

            {/* How to Sign */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How to Sign</Text>
              <View style={styles.mintBlock}>
                <Text style={styles.mintText}>{sign.howToSign || "Instructions not available"}</Text>
              </View>
            </View>

            {/* Note */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Note</Text>
              <View style={styles.mintBlock}>
                <Text style={styles.mintText}>{sign.note || "No additional notes"}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const MINT = "#cfe9e6";
const TEAL = "#48b4a8";

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropTap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    backgroundColor: "white",
    borderRadius: 24,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: TEAL,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  closeText: {
    fontSize: 24,
    color: "white",
    fontWeight: "bold",
  },
  saveStateContainer: {
    marginTop: 8,
    marginLeft: 60,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveStateIcon: {
    fontSize: 20,
    color: "#ffd700",
  },
  saveStateText: {
    fontSize: 14,
    color: TEAL,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  word: {
    fontSize: 32,
    fontWeight: "900",
    textAlign: "center",
    color: "#111",
    marginBottom: 16,
  },
  mediaSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  media: {
    width: 150,
    height: 150,
    borderRadius: 16,
    backgroundColor: MINT,
    borderWidth: 2,
    borderColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  section: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  mintBlock: {
    backgroundColor: MINT,
    borderRadius: 16,
    padding: 12,
    minHeight: 60,
    justifyContent: "center",
  },
  mintText: {
    fontSize: 14,
    color: "#111",
    lineHeight: 20,
    textAlign: "center",
  },
});