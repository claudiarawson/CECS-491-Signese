import {
  ScreenContainer,
  ScreenHeader,
} from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme } from "@/src/contexts/ThemeContext";
import { useTranslateCamera } from "@/src/features/translate/camera/useCamera";
import {
  createShortClipInferenceService,
  ShortClipInferenceService,
} from "@/src/features/translate/inference/shortClipInference";
import { TranslateInferenceResponse } from "@/src/features/translate/inference/types";
import {
  GREETING_INTRO_V0_LABELS,
  RUNTIME_V0_LABELS,
} from "@/src/features/translate/model/supportedSigns";
import { PostprocessDecision } from "@/src/features/translate/model/types";
import { useCaptionBuffer } from "@/src/features/translate/state";
import {
  TRANSLATE_SOURCE_LANG,
  TRANSLATE_TARGET_LANG,
  useTabTranslationHistory,
} from "@/src/features/translate/translationHistory";
import { formatTopScores } from "@/src/features/translate/utils";
import {
  fontWeight,
  getDeviceDensity,
  moderateScale,
  Spacing,
  Typography
} from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { CameraView } from "expo-camera";
import * as Speech from "expo-speech";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  DimensionValue,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

function CommonResponsesPlaceholder({
  styles,
  colors,
}: {
  styles: ReturnType<typeof createStyles>;
  colors: any;
}) {
  const items = useMemo(() => GREETING_INTRO_V0_LABELS.slice(0, 3), []);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <View style={styles.responsesPanel}>
      <View style={styles.responsesHeaderRowCompact}>
        <Pressable style={styles.responsesInfoButton} onPress={() => setShowInfo((prev) => !prev)}>
          <MaterialIcons name="info-outline" size={14} color={colors.primary} />
        </Pressable>
      </View>
      {showInfo ? (
        <View style={styles.responsesInfoBadge}>
          <Text style={styles.responsesInfoText}>Suggested follow-up signs.</Text>
        </View>
      ) : null}
      {items.map((item) => (
        <View key={item} style={styles.responseItem}>
          <MaterialIcons name="image" size={16} color={colors.subtext} />
          <Text style={styles.responseText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TranslateScreen() {
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { colors, theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const tabBarHeight = useBottomTabBarHeight();
  const styles = createStyles(density, textScale, tabBarHeight, colors, theme);

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
  const [showCommonResponsesInfo, setShowCommonResponsesInfo] = useState(false);
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
  const lastSpokenTokenIdRef = useRef<string | null>(null);
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
      setShowCommonResponsesInfo(false);
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
    if (!isVolumeOn) {
      Speech.stop();
      return;
    }

    if (tokens.length === 0) {
      lastSpokenTokenIdRef.current = null;
      return;
    }

    const latestToken = tokens[tokens.length - 1];
    if (!latestToken?.label) {
      return;
    }
    if (lastSpokenTokenIdRef.current === latestToken.id) {
      return;
    }

    lastSpokenTokenIdRef.current = latestToken.id;
    Speech.speak(latestToken.label, {
      language: "en-US",
      pitch: 1,
      rate: 0.95,
    });
  }, [isVolumeOn, tokens]);

  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

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
    setIsVolumeOn((previous) => {
      const next = !previous;
      if (!next) {
        Speech.stop();
      }
      return next;
    });
  };

  const handleClearCaptions = () => {
    Speech.stop();
    lastSpokenTokenIdRef.current = null;
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
  const nextChunkSecondsText = `${Math.max(0, nextChunkStartsInMs / 1000).toFixed(1)}s`;
  const prepProgress = Math.max(
    0,
    Math.min(1, 1 - nextChunkStartsInMs / Math.max(1, BETWEEN_CHUNKS_MS))
  );
  const activeProgressValue = 1 - chunkProgress;
  const verticalProgressHeight: DimensionValue =
    sequencePrompt === "move-next"
      ? "100%"
      : (`${Math.round(Math.max(0, Math.min(1, activeProgressValue)) * 100)}%` as DimensionValue);
  const prepRed = Math.round(244 + (107 - 244) * prepProgress);
  const prepGreen = Math.round(80 + (226 - 80) * prepProgress);
  const prepBlue = Math.round(93 + (193 - 93) * prepProgress);
  const prepTransitionColor = `rgb(${prepRed}, ${prepGreen}, ${prepBlue})`;

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
  <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScreenContainer
      backgroundColor={colors.background}
      safeStyle={{ backgroundColor: colors.background }}
      contentStyle={{ flex: 1, backgroundColor: colors.background }}
      contentPadded={false}
    >
        <ScreenHeader
          title="Translate"
          left={
            <Pressable
              onPress={() => router.push("/translate/history")}
              style={{ padding: 4 }}
              hitSlop={8}
              accessibilityLabel="Open translation history"
            >
              <MaterialIcons name="history" size={22} color={colors.subtext} />
            </Pressable>
          }
          right={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Pressable
                onPress={() => router.push("/(tabs)/settings" as any)}
                style={{ padding: 4 }}
                hitSlop={8}
                accessibilityLabel="Open settings"
              >
                <MaterialIcons name="settings" size={24} color={colors.subtext} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/(tabs)/account")}
                style={{ padding: 4 }}
                hitSlop={8}
                accessibilityLabel="Open account"
              >
                <MaterialIcons name="account-circle" size={26} color={colors.subtext} />
              </Pressable>
            </View>
          }
          titleStyle={{ color: colors.text }}
          style={{
            backgroundColor: "transparent",
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        />

        <View style={styles.content}>
          {isTranslateInitializing ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Preparing Translate...</Text>
            </View>
          ) : null}

          <View style={styles.topSection}>
            <View style={styles.videoCard}>
              {cameraActive && permission?.granted ? (
                <CameraView ref={cameraRef} style={styles.cameraPreview} facing={cameraFacing} mode="video" />
              ) : (
                <View style={styles.videoPlaceholderWrap}>
                  <MaterialIcons name="videocam" size={34} color={colors.subtext} />
                  <Text style={styles.videoPlaceholderTitle}>Tap to open camera</Text>
                  <Text style={styles.videoPlaceholderSubtitle}>
                    {permissionDenied
                      ? "Camera permission is needed to start live preview."
                      : "Live translation preview will appear here."}
                  </Text>
                </View>
              )}

              <View style={styles.videoTopSettingsOverlay}>
                <View style={styles.videoTopSettingsRow}>
                  <Pressable style={styles.smallControlBtnOverlay} onPress={toggleCamera}>
                    <MaterialIcons
                      name={cameraActive ? "videocam-off" : "videocam"}
                      size={18}
                      color="#FFFFFF"
                    />
                  </Pressable>
                  {Platform.OS !== "web" ? (
                    <Pressable style={styles.smallControlBtnOverlay} onPress={reverseCamera}>
                      <MaterialIcons name="flip-camera-ios" size={18} color="#FFFFFF" />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              {cameraActive && isRecordingClip ? (
                <View style={styles.sequenceProgressVerticalOverlay} pointerEvents="none">
                  <View style={styles.sequenceProgressVerticalTrack}>
                    <View
                      style={[
                        styles.sequenceProgressVerticalFill,
                        sequencePrompt === "move-next" && { backgroundColor: prepTransitionColor },
                        { height: verticalProgressHeight },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.captionsOverlayBox}>
                <View style={styles.captionsOverlayContent}>
                  <ScrollView
                    style={styles.captionsOverlayScrollArea}
                    contentContainerStyle={styles.captionsOverlayScrollContent}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text
                      style={
                        captionText.length > 0
                          ? styles.captionsOutputText
                          : styles.captionsOutputPlaceholderText
                      }
                    >
                      {captionOutput}
                    </Text>
                  </ScrollView>
                </View>
                <View style={styles.captionsOverlayActionColumn}>
                  <Pressable style={styles.captionsOverlayVolumeButton} onPress={handleToggleVolume}>
                    <MaterialIcons
                      name={isVolumeOn ? "volume-up" : "volume-off"}
                      size={16}
                      color="#FFFFFF"
                    />
                  </Pressable>
                  <Pressable style={styles.captionsOverlayClearButton} onPress={handleClearCaptions}>
                    <MaterialIcons name="delete-outline" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.cameraOverlayControls}>
                {cameraActive ? (
                  <View style={styles.bottomVideoControlsRow}>
                    {!isRecordingClip ? (
                      <Pressable
                        style={[styles.recordClipButton, isInferring && styles.recordClipButtonDisabled]}
                        onPress={handleRecordClipToggle}
                        disabled={isInferring || isRecordCooldown}
                      >
                        <MaterialIcons
                          name={isRecordCooldown ? "hourglass-top" : "fiber-manual-record"}
                          size={16}
                          color="#FFFFFF"
                        />
                        <Text style={styles.recordClipButtonText}>
                          {isRecordCooldown ? `Get Ready (${cooldownSecondsText})` : "Record Clip"}
                        </Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        style={[
                          styles.cancelCornerButton,
                          stopAfterCurrentInference && styles.cancelCornerButtonPressed,
                        ]}
                        onPress={handleCancelNextClip}
                      >
                        <MaterialIcons name="close" size={16} color="#FFFFFF" />
                        <Text style={styles.cancelCornerButtonText}>Stop</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[
                        styles.commonResponsesControlArrow,
                        showCommonResponses && styles.commonResponsesControlArrowOpened,
                      ]}
                      onPress={() => setShowCommonResponses((prev) => !prev)}
                    >
                      <Text
                        style={[
                          styles.commonResponsesControlArrowLabel,
                          showCommonResponses && { color: "#FFFFFF" },
                        ]}
                      >
                        Responses
                      </Text>
                      <MaterialIcons
                        name={showCommonResponses ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                        size={18}
                        color="#FFFFFF"
                      />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.previewCameraButton} onPress={handlePreviewCamera}>
                    <MaterialIcons name="videocam" size={16} color="#FFFFFF" />
                    <Text style={styles.recordClipButtonText}>Open Preview</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomResponsesArea}>
            <View style={styles.commonResponsesHeaderRow}>
              <Text style={styles.commonResponsesHeaderText}>Common Responses</Text>
              {showCommonResponses ? (
                <Pressable
                  style={styles.commonResponsesInfoButton}
                  onPress={() => setShowCommonResponsesInfo((prev) => !prev)}
                >
                  <MaterialIcons name="info-outline" size={14} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
            {!showCommonResponses ? (
              <View style={styles.commonResponsesInfoPopup}>
                <Text style={styles.commonResponsesInfoPopupText}>
                  Suggested follow-up signs based on your recent recognized output. Tap the Responses arrow to show or
                  hide them.
                </Text>
              </View>
            ) : showCommonResponsesInfo ? (
              <View style={styles.commonResponsesInfoPopup}>
                <Text style={styles.commonResponsesInfoPopupText}>
                  Suggested follow-up signs based on your recent recognized output.
                </Text>
              </View>
            ) : null}
            {showCommonResponses ? (
              <View style={styles.commonResponsesBottomStrip}>
                {GREETING_INTRO_V0_LABELS.slice(0, 2).map((item) => (
                  <View key={item} style={styles.commonResponseImageCard}>
                    <MaterialIcons name="image" size={20} color={colors.subtext} />
                    <Text style={styles.commonResponseImageLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        </View>

        {/* TODO(model): Switch adapter from mock to local or backend inference after training first constrained model. */}
        {/* TODO(sequence-mode): Enable longer clip recording and sequence tokenization mode on backend/local model support. */}
        {/* TODO(dataset): Replace Common Responses panel with label-aware dictionary suggestions from dataset manifest. */}
            </ScreenContainer>
    </View>
  );
}

const createStyles = (
  density: number,
  textScale: number,
  tabBarHeight: number,
  colors: any,
  theme: "light" | "dark"
) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.md + tabBarHeight,
    },
    loadingOverlay: {
      marginTop: Spacing.sm,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: asl.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...asl.shadow.card,
    },
    loadingText: {
      ...Typography.caption,
      color: colors.subtext,
      fontWeight: fontWeight.medium,
    },
    topSection: {
      flex: 1,
      flexDirection: "row",
      marginTop: Spacing.md,
      minHeight: 0,
    },
    videoCard: {
      flex: 1,
      minHeight: 0,
      borderRadius: ms(20),
      overflow: "hidden",
      backgroundColor: theme === "dark" ? "rgba(15,23,32,0.75)" : "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: colors.border,
      ...asl.shadow.card,
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
      color: colors.text,
      marginTop: Spacing.xs,
      textAlign: "center",
      fontSize: ts(20),
      lineHeight: ts(26),
    },
    videoPlaceholderSubtitle: {
      ...Typography.caption,
      color: colors.subtext,
      marginTop: ms(6),
      textAlign: "center",
      fontSize: ts(14),
      lineHeight: ts(20),
    },
    cameraOverlayControls: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: Spacing.sm,
      alignItems: "center",
    },
    videoTopSettingsOverlay: {
      position: "absolute",
      top: Spacing.sm,
      left: Spacing.sm,
      right: Spacing.sm,
      alignItems: "center",
    },
    videoTopSettingsRow: {
      flexDirection: "row",
      gap: Spacing.xs,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme === "dark" ? "rgba(15,23,32,0.72)" : "rgba(20, 34, 31, 0.35)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    smallControlBtnOverlay: {
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      backgroundColor: theme === "dark" ? "rgba(37,50,65,0.85)" : "rgba(44, 93, 86, 0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    historyCornerButton: {
      position: "absolute",
      top: Spacing.sm,
      left: Spacing.sm,
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    sequenceProgressVerticalOverlay: {
      position: "absolute",
      left: Spacing.xs,
      top: "50%",
      transform: [{ translateY: -40 }],
      width: 12,
      height: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    sequenceProgressVerticalTrack: {
      width: 8,
      height: 80,
      borderRadius: 999,
      backgroundColor: "rgba(255,255,255,0.22)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.28)",
      overflow: "hidden",
      justifyContent: "flex-end",
    },
    sequenceProgressVerticalFill: {
      width: "100%",
      borderRadius: 999,
      backgroundColor: colors.primary,
    },
    captionsOverlayBox: {
      position: "absolute",
      left: Spacing.sm,
      right: Spacing.sm,
      bottom: ms(58),
      maxHeight: ms(120),
      borderRadius: 14,
      backgroundColor: theme === "dark" ? "rgba(15,23,32,0.96)" : "rgba(12, 28, 24, 0.92)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    captionsOverlayContent: {
      paddingRight: 38,
      paddingBottom: 2,
    },
    captionsOverlayScrollArea: {
      maxHeight: ms(64),
    },
    captionsOverlayScrollContent: {
      paddingBottom: 2,
    },
    captionsOverlayActionColumn: {
      position: "absolute",
      right: 8,
      bottom: 8,
      alignItems: "center",
      gap: 6,
    },
    captionsOverlayClearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(214, 64, 69, 0.35)",
      borderWidth: 1,
      borderColor: "rgba(214, 64, 69, 0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    captionsOverlayVolumeButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme === "dark" ? "rgba(37,50,65,0.95)" : "rgba(44, 93, 86, 0.75)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    bottomVideoControlsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    commonResponsesControlArrow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme === "dark" ? "rgba(37,50,65,0.95)" : "rgba(44, 93, 86, 0.86)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
      justifyContent: "center",
    },
    commonResponsesControlArrowLabel: {
      ...Typography.caption,
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: ts(11),
      lineHeight: ts(14),
    },
    commonResponsesControlArrowOpened: {
      backgroundColor: "rgba(214, 64, 69, 0.35)",
      borderColor: "rgba(214, 64, 69, 0.5)",
    },
    bottomResponsesArea: {
      marginTop: Spacing.sm,
      alignItems: "stretch",
      justifyContent: "flex-start",
      minHeight: ms(62),
    },
    commonResponsesHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.xs,
    },
    commonResponsesHeaderText: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: fontWeight.strong,
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    commonResponsesInfoPopup: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    commonResponsesInfoPopupText: {
      ...Typography.caption,
      color: colors.subtext,
      fontSize: ts(12),
      lineHeight: ts(17),
    },
    commonResponsesInfoButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    commonResponsesBottomStrip: {
      width: "100%",
      flexDirection: "row",
      gap: Spacing.xs,
      paddingHorizontal: 0,
      height: ms(130),
      marginBottom: Spacing.xs,
    },
    commonResponseImageCard: {
      flex: 1,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      padding: Spacing.sm,
    },
    commonResponseImageLabel: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: fontWeight.strong,
      textAlign: "center",
      fontSize: ts(13),
      lineHeight: ts(18),
    },
    recordClipButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
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
      backgroundColor: colors.primary,
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
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#D64045",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.65)",
      justifyContent: "center",
    },
    cancelCornerButtonPressed: {
      backgroundColor: "#7D8790",
      borderColor: "rgba(255,255,255,0.35)",
    },
    cancelCornerButtonText: {
      ...Typography.caption,
      color: "#FFFFFF",
      fontWeight: "700",
      fontSize: ts(11),
      lineHeight: ts(14),
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    responsesInfoBadge: {
      marginBottom: ms(6),
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 4,
    },
    responsesInfoText: {
      ...Typography.caption,
      color: colors.subtext,
      fontSize: ts(9),
      lineHeight: ts(12),
    },
    responseItem: {
      borderRadius: ms(12),
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      minHeight: ms(52),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
      paddingVertical: ms(6),
      gap: ms(4),
    },
    responseText: {
      ...Typography.caption,
      color: colors.text,
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    captionsLabel: {
      ...Typography.sectionTitle,
      color: colors.text,
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
      borderColor: colors.border,
      backgroundColor: colors.card,
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
      color: "#FFFFFF",
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
      minHeight: 54,
    },
    captionsOutputPlaceholderText: {
      ...Typography.caption,
      color: "rgba(255,255,255,0.9)",
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
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    reportOutputBtnDisabled: {
      opacity: 0.65,
    },
    reportOutputBtnText: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: "700",
    },
    reportOutputBtnTextDisabled: {
      color: colors.subtext,
    },
    captionsSubText: {
      ...Typography.caption,
      color: colors.subtext,
      marginTop: Spacing.xs,
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    clearCaptionsButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      backgroundColor: theme === "dark" ? "rgba(37,50,65,0.85)" : "rgba(44, 93, 86, 0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
    },
    clearCaptionsButtonText: {
      ...Typography.caption,
      color: "#FFFFFF",
      fontWeight: "700",
    },
  });
};