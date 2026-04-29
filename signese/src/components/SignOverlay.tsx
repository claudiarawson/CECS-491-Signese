import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator} from "react-native";
import { Video, ResizeMode } from "expo-av";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { Sign } from "../features/dictionary/types";
import { toggleSavedId, isSaved } from "../features/dictionary/storage/saved.local";
import { resolveVideoUrlFromUiSign } from "../services/dictionary/dictionarySigns.service";
import { asl } from "@/src/theme/aslConnectTheme";
import { fontWeight } from "@/src/theme";

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
        <Pressable style={styles.backdropTap} onPress={onClose} accessibilityLabel="Close sign details" />
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.iconCircle, pressed && styles.pressedDim]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <MaterialIcons name="close" size={22} color={asl.text.primary} />
            </Pressable>
            <Pressable
              onPress={() => void handleToggleSave()}
              style={({ pressed }) => [styles.savePill, saved && styles.savePillOn, pressed && styles.pressedDim]}
              accessibilityRole="button"
              accessibilityLabel={saved ? "Remove from saved" : "Save sign"}
            >
              <Text style={styles.savePillIcon}>{saved ? "★" : "☆"}</Text>
              <Text style={styles.savePillText}>{saved ? "Saved" : "Save"}</Text>
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.word}>{sign.word}</Text>

            {sign.status && sign.status !== "reviewed" ? (
              <View style={styles.statusBadgeWrap}>
                <Text style={styles.statusBadgeText}>
                  {sign.status === "draft" ? "Draft metadata" : sign.status}
                </Text>
              </View>
            ) : null}

            {sign.source === "community" ? (
              <View style={styles.communityRow}>
                <MaterialIcons name="groups" size={16} color={asl.accentCyan} />
                <Text style={styles.communityText}>Community sign</Text>
              </View>
            ) : null}

            <View style={styles.mediaSection}>
              {resolvingVideo ? (
                <View style={styles.mediaLoading}>
                  <ActivityIndicator size="large" color={asl.accentCyan} />
                  <Text style={styles.mediaHint}>Getting video link…</Text>
                </View>
              ) : playUri ? (
                <View style={styles.videoWrap}>
                  {!videoDecodeReady ? (
                    <View style={styles.videoBuffering}>
                      <ActivityIndicator size="large" color={asl.accentCyan} />
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
                <View style={styles.mediaUnavailable}>
                  <MaterialIcons name="videocam-off" size={40} color={asl.text.muted} />
                  <Text style={styles.mediaUnavailableTitle}>Video unavailable</Text>
                  {videoError ? <Text style={styles.mediaHint}>{videoError}</Text> : null}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Definition</Text>
              <View style={[styles.glassBlock, isPlaceholderDefinition && styles.placeholderBlock]}>
                <Text style={styles.bodyText}>{sign.definition}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How to sign</Text>
              <View style={[styles.glassBlock, isPlaceholderHowTo && styles.placeholderBlock]}>
                <Text style={styles.bodyText}>{sign.howToSign}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Note</Text>
              <View style={styles.glassBlock}>
                <Text style={[styles.bodyText, !sign.note && styles.bodyTextMuted]}>
                  {sign.note || "No additional notes"}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5, 2, 8, 0.72)",
    justifyContent: "center",
    alignItems: "center"},
  backdropTap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0},
  content: {
    backgroundColor: "rgba(14, 8, 22, 0.94)",
    borderRadius: asl.radius.xl,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
    width: "88%",
    maxHeight: "82%",
    borderWidth: 1,
    borderColor: asl.glass.border,
    ...asl.shadow.card},
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8},
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.35)"},
  savePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: asl.glass.border,
    backgroundColor: "rgba(0,0,0,0.3)"},
  savePillOn: {
    borderColor: "rgba(251, 191, 36, 0.55)",
    backgroundColor: "rgba(251, 191, 36, 0.12)"},
  savePillIcon: {
    fontSize: 22,
    color: "#FBBF24"},
  savePillText: {
    fontSize: 15,
    fontWeight: fontWeight.emphasis,
    color: asl.text.primary},
  pressedDim: {
    opacity: 0.85},
  scrollContent: {
    paddingBottom: 12},
  word: {
    fontSize: 28,
    fontWeight: fontWeight.emphasis,
    textAlign: "center",
    color: asl.text.primary,
    marginBottom: 10,
    letterSpacing: 0.2},
  statusBadgeWrap: {
    alignSelf: "center",
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)"},
  statusBadgeText: {
    fontSize: 12,
    fontWeight: fontWeight.medium,
    color: "#FCD34D",
    textTransform: "capitalize"},
  communityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 14},
  communityText: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: asl.accentCyan},
  mediaSection: {
    alignItems: "center",
    marginBottom: 18},
  videoWrap: {
    width: "100%",
    minHeight: 200,
    borderRadius: asl.radius.md,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)"},
  videoBuffering: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderRadius: asl.radius.md},
  videoBufferingText: {
    color: asl.text.secondary,
    marginTop: 10,
    fontSize: 13},
  video: {
    width: "100%",
    height: 200,
    borderRadius: asl.radius.md,
    backgroundColor: "#000"},
  videoHidden: {
    opacity: 0},
  mediaLoading: {
    width: "100%",
    minHeight: 168,
    borderRadius: asl.radius.md,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 12},
  mediaUnavailable: {
    width: "100%",
    minHeight: 160,
    borderRadius: asl.radius.md,
    backgroundColor: "rgba(0,0,0,0.32)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    gap: 10},
  mediaUnavailableTitle: {
    fontSize: 16,
    fontWeight: fontWeight.emphasis,
    color: asl.text.secondary},
  mediaHint: {
    fontSize: 12,
    color: asl.text.muted,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18},
  section: {
    marginBottom: 16},
  sectionLabel: {
    fontSize: 13,
    fontWeight: fontWeight.medium,
    color: asl.text.secondary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase"},
  glassBlock: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: asl.radius.md,
    padding: 14,
    minHeight: 56,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: asl.glass.border},
  placeholderBlock: {
    borderStyle: "dashed",
    borderColor: "rgba(34, 211, 238, 0.35)",
    backgroundColor: "rgba(34, 211, 238, 0.06)"},
  bodyText: {
    fontSize: 15,
    color: asl.text.primary,
    lineHeight: 22,
    textAlign: "center"},
  bodyTextMuted: {
    color: asl.text.muted,
    fontStyle: "italic"}});
