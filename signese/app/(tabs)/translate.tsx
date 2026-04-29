import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView } from "expo-camera";
import {
  semanticColors,
  Spacing,
  Typography,
  getDeviceDensity,
  moderateScale,
} from "@/src/theme";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
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
import {
  useTabTranslationHistory,
  TRANSLATE_SOURCE_LANG,
  TRANSLATE_TARGET_LANG,
} from "@/src/features/translate/translationHistory";

function CommonResponsesPlaceholder({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
  const items = useMemo(() => GREETING_INTRO_V0_LABELS.slice(0, 3), []);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.responsesPanel}>
      <View style={styles.responsesHeaderRowCompact}>
        <Pressable style={styles.responsesInfoButton} onPress={() => setShowInfo((prev) => !prev)}>
          <MaterialIcons name="info-outline" size={14} color="#2C5D56" />
        </Pressable>
      </View>
      {showInfo ? (
        <View style={styles.responsesInfoBadge}>
          <Text style={styles.responsesInfoText}>Suggested follow-up signs.</Text>
        </View>
      ) : null}
      {items.map((item) => (
        <View key={item} style={styles.responseItem}>
          <MaterialIcons name="image" size={16} color="#6C7A89" />
          <Text style={styles.responseText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TranslateScreen() {
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [lastDecision, setLastDecision] = useState<PostprocessDecision | null>(null);
  const [lastInference, setLastInference] = useState<TranslateInferenceResponse | null>(null);
  const [isInferring, setIsInferring] = useState(false);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [isRecordCooldown, setIsRecordCooldown] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [recordingStartedAtMs, setRecordingStartedAtMs] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [sequenceChunkIndex, setSequenceChunkIndex] = useState(0);
  const [sequencePrompt, setSequencePrompt] = useState<"sign-now" | "move-next" | null>(null);
  const [nextChunkStartsInMs, setNextChunkStartsInMs] = useState(0);
  const [stopAfterCurrentInference, setStopAfterCurrentInference] = useState(false);
  const [showCommonResponses, setShowCommonResponses] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isTranslateInitializing, setIsTranslateInitializing] = useState(true);
  const { captionText, tokens, append, clear } = useCaptionBuffer(30);
  const { addHistoryItem } = useTabTranslationHistory();
  const lastHistoryEntryIdRef = useRef<string | null>(null);
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
  const cameraRef = useRef<CameraView | null>(null);
  const continueSequenceRef = useRef(false);
  const chunkStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recordingPromiseRef = useRef<
    Promise<{ result?: { uri: string }; error?: unknown }> | null
  >(null);
  const CHUNK_DURATION_MS = 1500;
  const BETWEEN_CHUNKS_MS = 550;

  const shortClipService = useMemo<ShortClipInferenceService>(() => {
    return createShortClipInferenceService(RUNTIME_V0_LABELS);
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      const recorder = cameraRef.current as any;
      if (recorder?.stopRecording) {
        recorder.stopRecording();
      }
      recordingPromiseRef.current = null;
      shortClipService.reset();
      setIsRecordingClip(false);
      setIsRecordCooldown(false);
      setCooldownRemainingMs(0);
      setRecordingStartedAtMs(null);
      setRecordingElapsedMs(0);
      setSequenceChunkIndex(0);
      setSequencePrompt(null);
      setNextChunkStartsInMs(0);
      setStopAfterCurrentInference(false);
      setShowCommonResponses(false);
      continueSequenceRef.current = false;
      if (chunkStopTimeoutRef.current) {
        clearTimeout(chunkStopTimeoutRef.current);
        chunkStopTimeoutRef.current = null;
      }
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
    const interval = setInterval(tick, 50);
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

  useEffect(() => {
    if (!isRecordingClip || Platform.OS === "web") {
      return;
    }

    let cancelled = false;
    continueSequenceRef.current = true;

    const applyInferenceResponse = (response: TranslateInferenceResponse, clipDurationMs: number) => {
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

      if (response.tokens.length > 0 || (response.raw_top_k && response.raw_top_k.length > 0)) {
        for (const token of response.tokens) {
          addHistoryItem({
            originalText: token.label,
            translatedText: token.label,
            sourceLanguage: TRANSLATE_SOURCE_LANG,
            targetLanguage: TRANSLATE_TARGET_LANG,
            timestamp: new Date(token.end_ms || clipDurationMs).toISOString(),
            confidence: token.confidence,
          });
        }
      }

      const topScores = response.raw_top_k ?? [];
      if (topScores.length > 0) {
        const best = topScores[0];
        const primaryToken = response.tokens[0];
        setLastDecision({
          token: primaryToken
            ? {
                id: `resp-${Date.now()}-${primaryToken.label}`,
                label: primaryToken.label,
                source: "single",
                confidence: primaryToken.confidence,
                timestampMs: primaryToken.end_ms,
                rawTopK: topScores,
              }
            : undefined,
          smoothedScores: topScores,
          reason: primaryToken && best.score >= 0.45 ? "accepted" : "below-threshold",
        });
      }
    };

    const recordSingleChunk = async (): Promise<{ uri: string } | undefined> => {
      const recorder = cameraRef.current as any;
      if (!recorder?.recordAsync) {
        throw new Error("Video recording is not available on this device.");
      }
      recordingPromiseRef.current = recorder
        .recordAsync({
          maxDuration: 6,
          quality: "480p",
          mute: true,
        })
        .then((result: { uri: string } | undefined) => ({ result }))
        .catch((error: unknown) => ({ error }));

      chunkStopTimeoutRef.current = setTimeout(() => {
        const activeRecorder = cameraRef.current as any;
        if (activeRecorder?.stopRecording) {
          activeRecorder.stopRecording();
        }
      }, CHUNK_DURATION_MS);

      const outcome = recordingPromiseRef.current
        ? await Promise.race([
            recordingPromiseRef.current,
            new Promise<{ result?: { uri: string }; error?: unknown }>((resolve) => {
              setTimeout(() => resolve({ error: new Error("Recording timed out.") }), CHUNK_DURATION_MS + 3000);
            }),
          ])
        : { error: new Error("No recording was started.") };

      if (chunkStopTimeoutRef.current) {
        clearTimeout(chunkStopTimeoutRef.current);
        chunkStopTimeoutRef.current = null;
      }
      recordingPromiseRef.current = null;

      if (outcome?.error) {
        throw outcome.error instanceof Error
          ? outcome.error
          : new Error("An error occurred while recording a video.");
      }
      return outcome?.result;
    };

    const run = async () => {
      try {
        setSequencePrompt("sign-now");
        setStopAfterCurrentInference(false);
        while (continueSequenceRef.current && !cancelled) {
          setSequenceChunkIndex((prev) => prev + 1);
          setSequencePrompt("sign-now");
          setRecordingStartedAtMs(Date.now());
          setRecordingElapsedMs(0);

          const chunk = await recordSingleChunk();
          setRecordingStartedAtMs(null);
          setRecordingElapsedMs(0);

          if (!continueSequenceRef.current || cancelled) {
            break;
          }
          if (!chunk?.uri) {
            throw new Error("No recorded clip was captured.");
          }

          setIsInferring(true);
          try {
            const response = await shortClipService.inferRecordedClip({
              sequence: sequenceRef.current,
              clipUri: chunk.uri,
              startMs: 0,
              endMs: CHUNK_DURATION_MS,
            });
            applyInferenceResponse(response, CHUNK_DURATION_MS);
          } finally {
            setIsInferring(false);
          }

          if (!continueSequenceRef.current || cancelled) {
            break;
          }
          setSequencePrompt("move-next");
          setNextChunkStartsInMs(BETWEEN_CHUNKS_MS);
          await new Promise<void>((resolve) => {
            const startedAt = Date.now();
            const interval = setInterval(() => {
              const elapsed = Date.now() - startedAt;
              const remaining = Math.max(0, BETWEEN_CHUNKS_MS - elapsed);
              setNextChunkStartsInMs(remaining);
              if (remaining <= 0) {
                clearInterval(interval);
                resolve();
              }
            }, 100);
          });
          setNextChunkStartsInMs(0);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to run inference.";
        setInferenceError(message);
      } finally {
        setSequencePrompt(null);
        setNextChunkStartsInMs(0);
        setStopAfterCurrentInference(false);
        setIsRecordingClip(false);
        setRecordingStartedAtMs(null);
        setRecordingElapsedMs(0);
        setShowCommonResponses(true);
      }
    };

    run();
    return () => {
      cancelled = true;
      continueSequenceRef.current = false;
      const recorder = cameraRef.current as any;
      if (recorder?.stopRecording) {
        recorder.stopRecording();
      }
      if (chunkStopTimeoutRef.current) {
        clearTimeout(chunkStopTimeoutRef.current);
        chunkStopTimeoutRef.current = null;
      }
    };
  }, [isRecordingClip, shortClipService, append, addHistoryItem]);

  const handleRecordClipToggle = async () => {
    if (isRecordCooldown) {
      return;
    }
    setInferenceError(null);

    if (!isRecordingClip) {
      if (!cameraActive) {
        setInferenceError("Open camera preview first, then tap Record Clip.");
        return;
      }
      setSequenceChunkIndex(0);
      setSequencePrompt("sign-now");
      setIsRecordCooldown(true);
      return;
    }

    continueSequenceRef.current = false;
    setStopAfterCurrentInference(true);
    if (!isInferring) {
      setIsRecordingClip(false);
      setSequencePrompt(null);
      setNextChunkStartsInMs(0);
      setShowCommonResponses(true);
      const recorder = cameraRef.current as any;
      if (recorder?.stopRecording) {
        recorder.stopRecording();
      }
    }
  };

  const handleCancelNextClip = () => {
    if (!isRecordingClip) {
      return;
    }
    continueSequenceRef.current = false;
    setStopAfterCurrentInference(true);
    setNextChunkStartsInMs(0);
    if (!isInferring) {
      const recorder = cameraRef.current as any;
      if (recorder?.stopRecording) {
        recorder.stopRecording();
      }
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
    lastHistoryEntryIdRef.current = null;
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
  const chunkProgress = Math.max(0, Math.min(1, recordingElapsedMs / CHUNK_DURATION_MS));
  const chunkProgressPercent = `${Math.round(chunkProgress * 100)}%`;
  const nextChunkSecondsText = `${Math.max(0, nextChunkStartsInMs / 1000).toFixed(1)}s`;

  const permissionDenied = permission && !permission.granted;
  const captionOutput = captionText.length > 0 ? captionText : "Translation output will appear here.";
  const inferenceStatus =
    isRecordCooldown
      ? `Get ready... recording starts in ${cooldownSecondsText}`
      : isRecordingClip
      ? sequencePrompt === "move-next"
        ? `Move to the next sign... next recording starts in ${nextChunkSecondsText}.`
        : `Sign now (window ${sequenceChunkIndex > 0 ? sequenceChunkIndex : 1}, 1.5s each).`
      : isInferring
      ? stopAfterCurrentInference
        ? "Recognizing current sign, then stopping..."
        : "Recognizing current sign..."
      : inferenceError
        ? `Error: ${inferenceError}`
        : lastInference && lastInference.tokens.length === 0
          ? "No prediction"
        : lastDecision?.reason === "accepted"
      ? `Recognized: ${lastDecision.token?.label ?? "No prediction"}`
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
        left={
          <HeaderActionButton
            iconName="history"
            onPress={() => router.push("/translate/history")}
          />
        }
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
        {isTranslateInitializing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color="#2C5D56" />
            <Text style={styles.loadingText}>Preparing Translate...</Text>
          </View>
        ) : null}

        <View style={styles.topSection}>
          <View style={styles.videoCard}>
            {cameraActive && permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing={cameraFacing} mode="video" />
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

            {cameraActive && isRecordingClip ? (
              <View style={styles.sequenceProgressOverlay} pointerEvents="none">
                <View style={styles.sequenceProgressHeader}>
                  <Text
                    style={[
                      styles.sequenceProgressLabel,
                      sequencePrompt === "move-next" && styles.sequenceProgressLabelMoveNext,
                    ]}
                  >
                    {sequencePrompt === "move-next"
                      ? `Move next (starts in ${nextChunkSecondsText})`
                      : `Sign ${Math.max(1, sequenceChunkIndex)} now`}
                  </Text>
                  <Text style={styles.sequenceProgressLabel}>{recordingSecondsText}</Text>
                </View>
                <View style={styles.sequenceProgressTrack}>
                  <View
                    style={[
                      styles.sequenceProgressFill,
                      sequencePrompt === "move-next" && styles.sequenceProgressFillMoveNext,
                      { width: sequencePrompt === "move-next" ? "100%" : chunkProgressPercent },
                    ]}
                  />
                </View>
              </View>
            ) : null}
            {cameraActive && showCommonResponses ? (
              <View style={styles.commonResponsesOverlay}>
                <CommonResponsesPlaceholder styles={styles} />
              </View>
            ) : null
            }
            {cameraActive && isRecordingClip ? (
              <Pressable
                style={[
                  styles.cancelCornerButton,
                  stopAfterCurrentInference && styles.cancelCornerButtonPressed,
                ]}
                onPress={handleCancelNextClip}
              >
                <MaterialIcons name="close" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
            <Pressable
              style={styles.commonResponsesToggle}
              onPress={() => setShowCommonResponses((prev) => !prev)}
            >
              <MaterialIcons
                name={showCommonResponses ? "chevron-right" : "chevron-left"}
                size={20}
                color="#FFFFFF"
              />
            </Pressable>

            <View style={styles.cameraOverlayControls}>
              {cameraActive ? (
                !isRecordingClip ? (
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
                ) : null
              ) : (
                <Pressable style={styles.previewCameraButton} onPress={handlePreviewCamera}>
                  <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
                  <Text style={styles.recordClipButtonText}>Open Preview</Text>
                </Pressable>
              )}
            </View>
          </View>
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
          <ScrollView style={styles.captionsScroll} contentContainerStyle={styles.captionsScrollContent}>
            <Text
              style={
                captionText.length > 0 ? styles.captionsOutputText : styles.captionsOutputPlaceholderText
              }
            >
              {captionOutput}
            </Text>
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
          </ScrollView>
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

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
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
      flex: 1,
      flexDirection: "row",
      marginTop: Spacing.md,
      minHeight: 0,
    },
    videoCard: {
      flex: 1,
      minHeight: ms(280),
      borderRadius: ms(20),
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
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    videoPlaceholderSubtitle: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      marginTop: ms(6),
      textAlign: "center",
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    cameraOverlayControls: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Spacing.sm,
    alignItems: "center",
  },
  sequenceProgressOverlay: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: "rgba(20, 34, 31, 0.55)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  commonResponsesOverlay: {
    position: "absolute",
    top: "50%",
    right: Spacing.sm,
    transform: [{ translateY: -ms(110) }],
    backgroundColor: "rgba(20, 34, 31, 0.14)",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  commonResponsesToggle: {
    position: "absolute",
    right: Spacing.xs,
    top: "50%",
    marginTop: -18,
    width: 28,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(44, 93, 86, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sequenceProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  sequenceProgressLabel: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: ts(11),
    lineHeight: ts(14),
  },
  sequenceProgressLabelMoveNext: {
    color: "#FFE7A3",
  },
  sequenceProgressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },
  sequenceProgressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#6BE2C1",
  },
  sequenceProgressFillMoveNext: {
    backgroundColor: "#F4B740",
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
  cancelCornerButton: {
    position: "absolute",
    left: Spacing.sm,
    bottom: Spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#D64045",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelCornerButtonPressed: {
    backgroundColor: "#7D8790",
    borderColor: "rgba(255,255,255,0.35)",
  },
  recordClipButtonText: {
    ...Typography.caption,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  responsesPanel: {
      width: ms(116),
      minHeight: ms(220),
      borderRadius: ms(14),
      backgroundColor: "rgba(237, 245, 243, 0.56)",
      borderWidth: 1,
      borderColor: "rgba(216, 232, 228, 0.5)",
      paddingVertical: ms(6),
      paddingHorizontal: Spacing.xs,
    },
    responsesHeaderRowCompact: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginBottom: ms(4),
    },
    responsesInfoButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.75)",
      borderWidth: 1,
      borderColor: "rgba(201, 225, 220, 0.8)",
    },
    responsesInfoBadge: {
      marginBottom: ms(6),
      backgroundColor: "rgba(255,255,255,0.7)",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(201, 225, 220, 0.75)",
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    responsesInfoText: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      fontSize: ts(9),
      lineHeight: ts(12),
    },
    responseItem: {
      borderRadius: ms(12),
      backgroundColor: "rgba(255,255,255,0.85)",
      borderWidth: 1,
      borderColor: "rgba(213, 230, 227, 0.75)",
      minHeight: ms(52),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
      paddingVertical: ms(6),
      gap: ms(4),
    },
    responseText: {
      ...Typography.caption,
      color: semanticColors.text.primary,
      fontWeight: "600",
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    captionsControlsRow: {
      marginTop: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
    },
    leftControlsWrap: {
      width: ms(84),
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    rightControlsWrap: {
      width: ms(84),
      alignItems: "flex-end",
    },
    captionsLabelWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    smallControlBtn: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      backgroundColor: "#E2F0ED",
      borderWidth: 1,
      borderColor: "#C9E1DC",
      alignItems: "center",
      justifyContent: "center",
    },
    captionsLabel: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    captionsCard: {
      marginTop: Spacing.sm,
      minHeight: ms(100),
      maxHeight: ms(145),
      flexShrink: 0,
      borderRadius: ms(18),
      borderWidth: 1,
      borderColor: "#C8DDDA",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    captionsScroll: {
      flexGrow: 0,
    },
    captionsScrollContent: {
      paddingBottom: Spacing.xs,
    },
    captionsOutputText: {
      ...Typography.body,
      color: semanticColors.text.primary,
      fontSize: ts(16),
      lineHeight: ts(20),
    fontWeight: "700",
    minHeight: 54,
  },
    captionsOutputPlaceholderText: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      fontSize: ts(12),
      lineHeight: ts(16),
      minHeight: 54,
    },
    captionOutputActions: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    reportOutputBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      alignSelf: "flex-start",
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: "#E8F2F0",
      borderWidth: 1,
      borderColor: "#C9E1DC",
    },
    reportOutputBtnDisabled: {
      opacity: 0.65,
    },
    reportOutputBtnText: {
      ...Typography.caption,
      color: "#214F46",
      fontWeight: "700",
    },
    reportOutputBtnTextDisabled: {
      color: "#9CA3AF",
    },
    captionsSubText: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      marginTop: Spacing.xs,
      fontSize: ts(12),
      lineHeight: ts(16),
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
};