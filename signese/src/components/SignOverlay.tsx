import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Video, ResizeMode } from "expo-av";
import type { Sign } from "../features/dictionary/types";
import { toggleSavedId, isSaved } from "../features/dictionary/storage/saved.local";
import { resolveVideoUrlFromUiSign } from "../services/dictionary/dictionarySigns.service";

interface SignOverlayProps {
  visible: boolean;
  sign: Sign | null;
  onClose(): void;
}

export default function SignOverlay({ visible, sign, onClose }: SignOverlayProps) {
  const [saved, setSaved] = useState(false);
  const [playUri, setPlayUri] = useState<string | null>(null);
  const [resolvingVideo, setResolvingVideo] = useState(false);
  const [videoDecodeReady, setVideoDecodeReady] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  /** Bumps when the modal closes or a new resolve starts so stale async work cannot leave loading stuck. */
  const resolveGenerationRef = useRef(0);

  const signId = sign?.id;

  useEffect(() => {
    setVideoDecodeReady(false);
  }, [playUri]);

  useEffect(() => {
    if (visible && signId) {
      isSaved(signId).then(setSaved);
    }
  }, [visible, signId]);

  /**
   * Resolve Storage download URL when opening a sign.
   * Uses a generation counter so Strict Mode / overlapping requests do not leave `resolvingVideo` stuck true.
   */
  useEffect(() => {
    if (!visible || !sign) {
      resolveGenerationRef.current += 1;
      setPlayUri(null);
      setVideoError(null);
      setResolvingVideo(false);
      return;
    }

    setVideoError(null);
    const signForResolve = sign;
    const immediate = signForResolve.mediaUrl?.trim();
    if (immediate) {
      resolveGenerationRef.current += 1;
      setPlayUri(immediate);
      setResolvingVideo(false);
      return;
    }

    const gen = ++resolveGenerationRef.current;
    setResolvingVideo(true);

    async function resolve() {
      try {
        const url = await resolveVideoUrlFromUiSign(signForResolve);
        if (gen !== resolveGenerationRef.current) return;
        if (url) {
          setPlayUri(url);
          setVideoError(null);
        } else {
          setPlayUri(null);
          setVideoError(
            "Video URL could not be loaded. Allow Storage read access in Firebase rules, or sign in if rules require auth."
          );
        }
      } catch (e) {
        if (gen !== resolveGenerationRef.current) return;
        setPlayUri(null);
        setVideoError(e instanceof Error ? e.message : "Could not resolve video");
      } finally {
        if (gen === resolveGenerationRef.current) {
          setResolvingVideo(false);
        }
      }
    }

    void resolve();
  }, [visible, sign?.id, sign?.mediaUrl, sign?.storagePath, sign?.videoId]);

  const handleToggleSave = async () => {
    if (!sign) return;
    const newSaved = await toggleSavedId(sign.id, sign);
    setSaved(newSaved);
  };

  if (!sign) return null;

  const isPlaceholderDefinition = sign.definition.startsWith("Definition not added");
  const isPlaceholderHowTo = sign.howToSign.startsWith("How-to description not added");

  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose} animationType="fade">
      <View style={styles.overlay}>
        <Pressable style={styles.backdropTap} onPress={onClose} />
        <View style={styles.content}>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>

          <Pressable onPress={handleToggleSave} style={styles.saveStateContainer}>
            <Text style={styles.saveStateIcon}>{saved ? "★" : "☆"}</Text>
            <Text style={styles.saveStateText}>{saved ? "Saved" : "Not saved"}</Text>
          </Pressable>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.word}>{sign.word}</Text>

            {sign.status && sign.status !== "reviewed" ? (
              <Text style={styles.statusBadge}>{sign.status === "draft" ? "Draft metadata" : sign.status}</Text>
            ) : null}

            <View style={styles.mediaSection}>
              {resolvingVideo ? (
                <View style={styles.media}>
                  <ActivityIndicator size="large" color={TEAL} />
                  <Text style={styles.mediaHint}>Getting video link…</Text>
                </View>
              ) : playUri ? (
                <View style={styles.videoWrap}>
                  {!videoDecodeReady ? (
                    <View style={styles.videoBuffering}>
                      <ActivityIndicator size="large" color="#fff" />
                      <Text style={styles.videoBufferingText}>Buffering…</Text>
                    </View>
                  ) : null}
                  <Video
                    style={[styles.video, !videoDecodeReady && styles.videoHidden]}
                    source={{ uri: playUri }}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay={visible && !!playUri}
                    onLoad={() => setVideoDecodeReady(true)}
                    onError={(e) => {
                      if (__DEV__) console.warn("[SignOverlay] Video playback error", e);
                      setVideoError("Playback failed. The file may be missing, corrupt, or the URL expired.");
                      setPlayUri(null);
                      setVideoDecodeReady(false);
                    }}
                  />
                </View>
              ) : (
                <View style={styles.media}>
                  <Text style={styles.mediaText}>Video unavailable</Text>
                  {videoError ? <Text style={styles.mediaHint}>{videoError}</Text> : null}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Definition</Text>
              <View style={[styles.mintBlock, isPlaceholderDefinition && styles.placeholderBlock]}>
                <Text style={styles.mintText}>{sign.definition}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How to Sign</Text>
              <View style={[styles.mintBlock, isPlaceholderHowTo && styles.placeholderBlock]}>
                <Text style={styles.mintText}>{sign.howToSign}</Text>
              </View>
            </View>

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
    fontSize: 34,
    lineHeight: 40,
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
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#856404",
    backgroundColor: "#fff3cd",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  mediaSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  videoWrap: {
    width: "100%",
    minHeight: 200,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  videoBuffering: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderRadius: 16,
  },
  videoBufferingText: {
    color: "#ddd",
    marginTop: 10,
    fontSize: 13,
  },
  video: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    backgroundColor: "#111",
  },
  videoHidden: {
    opacity: 0,
  },
  media: {
    width: "100%",
    minHeight: 160,
    borderRadius: 16,
    backgroundColor: MINT,
    borderWidth: 2,
    borderColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  mediaText: {
    fontSize: 15,
    color: "#333",
    fontWeight: "700",
    textAlign: "center",
  },
  mediaHint: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
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
  placeholderBlock: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "#9cc",
  },
  mintText: {
    fontSize: 14,
    color: "#111",
    lineHeight: 20,
    textAlign: "center",
  },
});
