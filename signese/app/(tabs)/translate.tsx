import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView } from "expo-camera";
import { semanticColors, Spacing, Typography } from "@/src/theme";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useTranslateCamera } from "@/src/features/translate/camera/useCamera";
import {
  GREETING_INTRO_V0_LABELS,
  RUNTIME_V0_LABELS,
} from "@/src/features/translate/model/supportedSigns";
import { PostprocessDecision } from "@/src/features/translate/model/types";
import { useCaptionBuffer } from "@/src/features/translate/state";
import { formatTopScores } from "@/src/features/translate/utils";
import {
  createShortClipInferenceService,
  ShortClipInferenceService,
} from "@/src/features/translate/inference/shortClipInference";
import { TranslateInferenceResponse } from "@/src/features/translate/inference/types";

function CommonResponsesPlaceholder() {
  const items = useMemo(() => GREETING_INTRO_V0_LABELS.slice(0, 3), []);

  return (
    <View style={styles.responsesPanel}>
      <Text style={styles.responsesTitle}>Common Responses</Text>
      {items.map((item) => (
        <View key={item} style={styles.responseItem}>
          <MaterialIcons name="image" size={16} color="#6C7A89" />
          <Text style={styles.responseText}>{item}</Text>
        </View>
      ))}
      <Text style={styles.responsesHint}>Suggested signs/GIFs</Text>
    </View>
  );
}

export default function TranslateScreen() {
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);

  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [lastDecision, setLastDecision] = useState<PostprocessDecision | null>(null);
  const [lastInference, setLastInference] = useState<TranslateInferenceResponse | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [isRecordCooldown, setIsRecordCooldown] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [recordingStartedAtMs, setRecordingStartedAtMs] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isTranslateInitializing, setIsTranslateInitializing] = useState(true);
  const { captionText, tokens, append, clear } = useCaptionBuffer(30);
  const {
    permission,
    cameraActive,
    cameraFacing,
    activateCamera,
    deactivateCamera,
    toggleCamera,
    reverseCamera,
  } = useTranslateCamera();
  const sequenceRef = useRef(0);

  const shortClipService = useMemo<ShortClipInferenceService>(() => {
    return createShortClipInferenceService(RUNTIME_V0_LABELS);
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      shortClipService.reset();
      setIsRecordingClip(false);
      setIsRecordCooldown(false);
      setCooldownRemainingMs(0);
      setRecordingStartedAtMs(null);
      setRecordingElapsedMs(0);
    }
  }, [cameraActive, shortClipService]);

  useEffect(() => {
    if (permission == null) {
      return;
    }

    const timeout = setTimeout(() => {
      setIsTranslateInitializing(false);
    }, 250);

    return () => clearTimeout(timeout);
  }, [permission]);

  useEffect(() => {
    if (!isRecordingClip || recordingStartedAtMs == null) {
      return;
    }

    const tick = () => {
      setRecordingElapsedMs(Math.max(0, Date.now() - recordingStartedAtMs));
    };

    tick();
    const interval = setInterval(tick, 200);
    return () => clearInterval(interval);
  }, [isRecordingClip, recordingStartedAtMs]);

  useEffect(() => {
    if (!isRecordCooldown) {
      return;
    }

    const startedAt = Date.now();
    const durationMs = 1000;
    setCooldownRemainingMs(durationMs);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, durationMs - elapsed);
      setCooldownRemainingMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setIsRecordCooldown(false);
        setCooldownRemainingMs(0);
        setIsRecordingClip(true);
        setRecordingStartedAtMs(Date.now());
        setRecordingElapsedMs(0);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRecordCooldown]);

  const handleRecordClipToggle = async () => {
    if (isInferring || isRecordCooldown) {
      return;
    }

    setInferenceError(null);

    if (!isRecordingClip) {
      if (!cameraActive) {
        setInferenceError("Open camera preview first, then tap Record Clip.");
        return;
      }

      setIsRecordCooldown(true);
      return;
    }

    setIsRecordingClip(false);
    setRecordingStartedAtMs(null);
    setIsInferring(true);

    try {
      // TODO(camera): Replace mock short-clip generation with true recorded clip capture from CameraView.
      const response = await shortClipService.inferShortClip({
        sequence: sequenceRef.current,
        frameCount: 12,
        fps: 12,
      });
      sequenceRef.current += 1;
      setLastInference(response);

      if (response.mode === "single" && response.tokens.length > 0) {
        for (const token of response.tokens) {
          append({
            id: `manual-${Date.now()}-${token.label}-${token.end_ms}`,
            label: token.label,
            source: "single",
            confidence: token.confidence,
            timestampMs: token.end_ms,
            rawTopK: response.raw_top_k ?? [],
          });
        }
      }

      const topScores = response.raw_top_k ?? [];
      if (topScores.length > 0) {
        const best = topScores[0];
        setLastDecision({
          token:
            response.tokens.length > 0
              ? {
                  id: `resp-${Date.now()}-${response.tokens[0].label}`,
                  label: response.tokens[0].label,
                  source: "single",
                  confidence: response.tokens[0].confidence,
                  timestampMs: response.tokens[0].end_ms,
                  rawTopK: topScores,
                }
              : undefined,
          smoothedScores: topScores,
          reason: best.score >= 0.45 ? "accepted" : "below-threshold",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run inference.";
      setInferenceError(message);
    } finally {
      setIsInferring(false);
      deactivateCamera();
    }
  };

  const handlePreviewCamera = async () => {
    setInferenceError(null);
    const opened = await activateCamera();
    if (!opened) {
      setInferenceError("Camera permission is required to open preview.");
    }
  };

  const handleToggleVolume = () => {
    setIsVolumeOn((previous) => !previous);
  };

  const handleClearCaptions = () => {
    clear();
    setLastDecision(null);
    setLastInference(null);
    setInferenceError(null);
    setIsRecordingClip(false);
    setIsRecordCooldown(false);
    setCooldownRemainingMs(0);
    setRecordingStartedAtMs(null);
    setRecordingElapsedMs(0);
  };

  const recordingSecondsText = `${(recordingElapsedMs / 1000).toFixed(1)}s`;
  const cooldownSecondsText = `${(cooldownRemainingMs / 1000).toFixed(1)}s`;

  const permissionDenied = permission && !permission.granted;
  const captionOutput = captionText.length > 0 ? captionText : "Translation output will appear here.";
  const inferenceStatus =
    isRecordCooldown
      ? `Get ready... recording starts in ${cooldownSecondsText}`
      : isRecordingClip
      ? "Recording short clip... tap Stop & Infer when finished."
      : isInferring
      ? "Running short-clip inference..."
      : inferenceError
        ? `Error: ${inferenceError}`
        : lastDecision?.reason === "accepted"
      ? `Recognized: ${lastDecision.token?.label}`
      : lastDecision?.reason === "duplicate-suppressed"
        ? "Duplicate token suppressed"
        : cameraActive
          ? "Camera preview is on. Tap Record Clip when ready."
          : "Camera is off. Tap Open Preview in camera area.";
  const confidenceSummary = lastDecision
    ? `Top scores: ${formatTopScores(lastDecision.smoothedScores)}`
    : "Top scores: n/a";

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Translate"
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
        {isTranslateInitializing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2C5D56" />
            <Text style={styles.loadingText}>Preparing Translate...</Text>
          </View>
        ) : null}

        <View style={styles.topSection}>
          <View style={styles.videoCard}>
            {cameraActive && permission?.granted ? (
              <CameraView style={styles.cameraPreview} facing={cameraFacing} />
            ) : (
              <View style={styles.videoPlaceholderWrap}>
                <MaterialIcons name="videocam" size={34} color="#608D86" />
                <Text style={styles.videoPlaceholderTitle}>Tap to open camera</Text>
                <Text style={styles.videoPlaceholderSubtitle}>
                  {permissionDenied
                    ? "Camera permission is needed to start live preview."
                    : "Live translation preview will appear here."}
                </Text>
              </View>
            )}

            <View style={styles.cameraOverlayControls}>
              {cameraActive ? (
                <Pressable
                  style={[styles.recordClipButton, isInferring && styles.recordClipButtonDisabled]}
                  onPress={handleRecordClipToggle}
                  disabled={isInferring || isRecordCooldown}
                >
                  <MaterialIcons
                    name={isRecordingClip ? "stop-circle" : isRecordCooldown ? "hourglass-top" : "fiber-manual-record"}
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.recordClipButtonText}>
                    {isRecordCooldown
                      ? `Get Ready (${cooldownSecondsText})`
                      : isRecordingClip
                        ? `Stop & Infer (${recordingSecondsText})`
                        : "Record Clip"}
                  </Text>
                </Pressable>
              ) : (
                <Pressable style={styles.previewCameraButton} onPress={handlePreviewCamera}>
                  <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
                  <Text style={styles.recordClipButtonText}>Open Preview</Text>
                </Pressable>
              )}
            </View>
          </View>

          <CommonResponsesPlaceholder />
        </View>

        <View style={styles.captionsControlsRow}>
          <View style={styles.leftControlsWrap}>
            <Pressable style={styles.smallControlBtn} onPress={toggleCamera}>
              <MaterialIcons
                name={cameraActive ? "videocam-off" : "videocam"}
                size={18}
                color="#2C5D56"
              />
            </Pressable>
            {Platform.OS !== "web" ? (
              <Pressable style={styles.smallControlBtn} onPress={reverseCamera}>
                <MaterialIcons name="flip-camera-ios" size={18} color="#2C5D56" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.captionsLabelWrap} pointerEvents="none">
            <Text style={styles.captionsLabel}>Captions</Text>
          </View>

          <View style={styles.rightControlsWrap}>
            <Pressable style={styles.smallControlBtn} onPress={handleToggleVolume}>
              <MaterialIcons
                name={isVolumeOn ? "volume-up" : "volume-off"}
                size={18}
                color="#2C5D56"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.captionsCard}>
          <Text style={styles.captionsOutputText}>{captionOutput}</Text>
          <Text style={styles.captionsSubText}>{inferenceStatus}</Text>
          <Text style={styles.captionsSubText}>{confidenceSummary}</Text>
          <Text style={styles.captionsSubText}>
            Mode: {lastInference?.mode ?? "single"} | Last token count: {lastInference?.tokens.length ?? 0}
          </Text>
          <Text style={styles.captionsSubText}>
            Inference adapter: {lastInference?.adapter_name ?? "not-run-yet"}
          </Text>
          <Text style={styles.captionsSubText}>
            {isVolumeOn ? "Volume is on." : "Volume is muted."} Tokens: {tokens.length}
          </Text>
          <Pressable style={styles.clearCaptionsButton} onPress={handleClearCaptions}>
            <MaterialIcons name="delete-outline" size={16} color="#2C5D56" />
            <Text style={styles.clearCaptionsButtonText}>Clear captions</Text>
          </Pressable>
        </View>
      </View>

      {/* TODO(model): Switch adapter from mock to local or backend inference after training first constrained model. */}
      {/* TODO(sequence-mode): Enable longer clip recording and sequence tokenization mode on backend/local model support. */}
      {/* TODO(dataset): Replace Common Responses panel with label-aware dictionary suggestions from dataset manifest. */}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  loadingOverlay: {
    marginTop: Spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F2F0",
    borderWidth: 1,
    borderColor: "#C9E1DC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: {
    ...Typography.caption,
    color: "#2C5D56",
    fontWeight: "600",
  },
  topSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  videoCard: {
    flex: 1,
    minHeight: 250,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#D9ECE8",
    borderWidth: 1,
    borderColor: "#C6DEDA",
    position: "relative",
  },
  cameraPreview: {
    flex: 1,
  },
  videoPlaceholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  videoPlaceholderTitle: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  videoPlaceholderSubtitle: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: 6,
    textAlign: "center",
  },
  cameraOverlayControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.sm,
    alignItems: "center",
  },
  recordClipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(33, 79, 70, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  previewCameraButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(44, 93, 86, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
  },
  recordClipButtonDisabled: {
    opacity: 0.6,
  },
  recordClipButtonText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  responsesPanel: {
    width: 120,
    minHeight: 250,
    borderRadius: 18,
    backgroundColor: "#EDF5F3",
    borderWidth: 1,
    borderColor: "#D8E8E4",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  responsesTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: semanticColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  responseItem: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E6E3",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    paddingVertical: 6,
    gap: 4,
  },
  responseText: {
    ...Typography.caption,
    color: semanticColors.text.primary,
    fontWeight: "600",
  },
  responsesHint: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  captionsControlsRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  leftControlsWrap: {
    width: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  rightControlsWrap: {
    width: 84,
    alignItems: "flex-end",
  },
  captionsLabelWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  smallControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2F0ED",
    borderWidth: 1,
    borderColor: "#C9E1DC",
    alignItems: "center",
    justifyContent: "center",
  },
  captionsLabel: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
  },
  captionsCard: {
    marginTop: Spacing.sm,
    flex: 1,
    minHeight: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#C8DDDA",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
  },
  captionsOutputText: {
    ...Typography.body,
    color: semanticColors.text.primary,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    minHeight: 54,
  },
  captionsSubText: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: Spacing.xs,
  },
  clearCaptionsButton: {
    marginTop: Spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E8F2F0",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C9E1DC",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  clearCaptionsButtonText: {
    ...Typography.caption,
    color: "#2C5D56",
    fontWeight: "700",
  },
});