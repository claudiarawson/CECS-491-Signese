import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type DimensionValue,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { CameraView } from "expo-camera";
import * as Speech from "expo-speech";
import { Spacing, Typography, getDeviceDensity, moderateScale, fontWeight } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { GradientBackground } from "@/src/components/asl";
import { ScreenContainer } from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useTranslateCamera } from "@/src/features/translate/camera/useCamera";
import {
  GREETING_INTRO_V0_LABELS,
  RUNTIME_V0_LABELS,
} from "@/src/features/translate/model/supportedSigns";
import { useCaptionBuffer } from "@/src/features/translate/state";
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

function TranslateScreenHeader() {
  const { profile } = useAuthUser();
  const avatarRaw = profile?.avatar;
  const looksLikeEmoji = typeof avatarRaw === "string" && avatarRaw.length <= 3;
  const avatarEmoji = looksLikeEmoji ? avatarRaw! : getProfileIconById(avatarRaw).emoji;

  return (
    <View style={stylesStatic.screenHeader}>
      <View style={stylesStatic.screenHeaderSide}>
        <Pressable
          onPress={() => router.push("/translate/history" as any)}
          style={({ pressed }) => [stylesStatic.headerIconBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Translation history"
        >
          <MaterialIcons name="history" size={20} color={asl.accentCyan} />
        </Pressable>
      </View>
      <Text style={stylesStatic.screenHeaderTitle} numberOfLines={1}>
        Translate
      </Text>
      <View style={[stylesStatic.screenHeaderSide, stylesStatic.screenHeaderRight]}>
        <Pressable
          onPress={() => router.push("/(tabs)/settings" as any)}
          style={({ pressed }) => [stylesStatic.headerIconBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
        >
          <MaterialIcons name="settings" size={20} color={asl.text.secondary} />
        </Pressable>
        <Pressable
          onPress={() => router.push("/(tabs)/account" as any)}
          style={({ pressed }) => [stylesStatic.headerAvatarBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          <Text style={stylesStatic.headerAvatarEmoji}>{avatarEmoji}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const stylesStatic = StyleSheet.create({
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 48,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  screenHeaderSide: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 72,
  },
  screenHeaderRight: {
    justifyContent: "flex-end",
  },
  screenHeaderTitle: {
    flex: 1,
    textAlign: "center",
    color: asl.text.primary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  headerAvatarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(236, 72, 153, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(244, 114, 182, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  headerAvatarEmoji: {
    fontSize: 18,
  },
});

export default function TranslateScreen() {
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [isInferring, setIsInferring] = useState(false);
  const [isRecordingClip, setIsRecordingClip] = useState(false);
  const [isRecordCooldown, setIsRecordCooldown] = useState(false);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState(0);
  const [recordingStartedAtMs, setRecordingStartedAtMs] = useState<number | null>(null);
  const [recordingElapsedMs, setRecordingElapsedMs] = useState(0);
  const [sequencePrompt, setSequencePrompt] = useState<"sign-now" | "move-next" | null>(null);
  const [nextChunkStartsInMs, setNextChunkStartsInMs] = useState(0);
  const [stopAfterCurrentInference, setStopAfterCurrentInference] = useState(false);
  const [showCommonResponses, setShowCommonResponses] = useState(false);
  const [showCommonResponsesInfo, setShowCommonResponsesInfo] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isTranslateInitializing, setIsTranslateInitializing] = useState(true);
  const { captionText, append, clear, replaceCaptionFromText } = useCaptionBuffer(30);
  const { translationHistory, addHistoryItem, consumePendingReuseCaption } = useTabTranslationHistory();
  const lastHistoryEntryIdRef = useRef<string | null>(null);
  const {
    permission,
    cameraActive,
    cameraFacing,
    activateCamera,
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

  useFocusEffect(
    useCallback(() => {
      const text = consumePendingReuseCaption();
      if (text != null && text.length > 0) {
        replaceCaptionFromText(text);
        setInferenceError(null);
      }
      return () => {
        Speech.stop();
      };
    }, [consumePendingReuseCaption, replaceCaptionFromText])
  );

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
    if (!isRecordingClip || Platform.OS === "web") {
      return;
    }

    let cancelled = false;
    continueSequenceRef.current = true;

    const applyInferenceResponse = (response: TranslateInferenceResponse, clipDurationMs: number) => {
      sequenceRef.current += 1;

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
          const entryId = addHistoryItem({
            originalText: token.label,
            translatedText: token.label,
            sourceLanguage: TRANSLATE_SOURCE_LANG,
            targetLanguage: TRANSLATE_TARGET_LANG,
            timestamp: new Date(token.end_ms || clipDurationMs).toISOString(),
            confidence: token.confidence,
          });
          lastHistoryEntryIdRef.current = entryId;
        }
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
      if (previous) {
        Speech.stop();
      }
      return !previous;
    });
  };

  const handleClearCaptions = () => {
    Speech.stop();
    clear();
    lastHistoryEntryIdRef.current = null;
    setInferenceError(null);
    setIsRecordingClip(false);
    setIsRecordCooldown(false);
    setCooldownRemainingMs(0);
    setRecordingStartedAtMs(null);
    setRecordingElapsedMs(0);
  };

  const cooldownSecondsText = `${(cooldownRemainingMs / 1000).toFixed(1)}s`;
  const chunkProgress = Math.max(0, Math.min(1, recordingElapsedMs / CHUNK_DURATION_MS));
  const prepProgress = Math.max(
    0,
    Math.min(1, 1 - nextChunkStartsInMs / Math.max(1, BETWEEN_CHUNKS_MS))
  );
  const activeProgressValue = 1 - chunkProgress;
  const verticalProgressHeight: DimensionValue =
    sequencePrompt === "move-next"
      ? "100%"
      : (`${Math.round(Math.max(0, Math.min(1, activeProgressValue)) * 100)}%` as const);
  const prepRed = Math.round(244 + (107 - 244) * prepProgress);
  const prepGreen = Math.round(80 + (226 - 80) * prepProgress);
  const prepBlue = Math.round(93 + (193 - 93) * prepProgress);
  const prepTransitionColor = `rgb(${prepRed}, ${prepGreen}, ${prepBlue})`;

  const permissionDenied = permission && !permission.granted;
  const captionOutput = captionText.length > 0 ? captionText : "Translation output will appear here.";

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={{ flex: 1, backgroundColor: "transparent" }}
        contentPadded={false}
      >
        <TranslateScreenHeader />

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentInner}>
            {isTranslateInitializing ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={asl.accentCyan} />
                <Text style={styles.loadingText}>Preparing Translate…</Text>
              </View>
            ) : null}

            <View style={styles.topSection}>
              <View style={styles.videoCard}>
                <View style={styles.videoStage}>
                  {cameraActive && permission?.granted ? (
                    <CameraView ref={cameraRef} style={styles.cameraPreview} facing={cameraFacing} mode="video" />
                  ) : (
                    <View style={styles.videoPlaceholderWrap}>
                      <MaterialIcons name="videocam" size={38} color={asl.text.secondary} />
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
                          size={20}
                          color="#FFFFFF"
                        />
                      </Pressable>
                      {Platform.OS !== "web" ? (
                        <Pressable style={styles.smallControlBtnOverlay} onPress={reverseCamera}>
                          <MaterialIcons name="flip-camera-ios" size={20} color="#FFFFFF" />
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
                </View>

                <View style={styles.captionsStrip}>
                  <View style={styles.captionsStripInner}>
                    <ScrollView
                      style={styles.captionsStripScroll}
                      contentContainerStyle={styles.captionsStripScrollContent}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
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
                    <View style={styles.captionsStripActions}>
                      <Pressable style={styles.captionsStripIconBtn} onPress={handleToggleVolume}>
                        <MaterialIcons
                          name={isVolumeOn ? "volume-up" : "volume-off"}
                          size={20}
                          color="#FFFFFF"
                        />
                      </Pressable>
                      <Pressable style={styles.captionsStripIconBtnDanger} onPress={handleClearCaptions}>
                        <MaterialIcons name="delete-outline" size={20} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>

                <View style={styles.controlsStrip}>
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
                            size={18}
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
                          <MaterialIcons name="close" size={18} color="#FFFFFF" />
                          <Text style={styles.cancelCornerButtonText}>Stop</Text>
                        </Pressable>
                      )}
                      <Pressable
                        style={styles.commonResponsesControlArrow}
                        onPress={() => setShowCommonResponses((prev) => !prev)}
                      >
                        <Text style={styles.commonResponsesControlArrowLabel}>Responses</Text>
                        <MaterialIcons
                          name={showCommonResponses ? "keyboard-arrow-down" : "keyboard-arrow-up"}
                          size={20}
                          color="#FFFFFF"
                        />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable style={styles.previewCameraButton} onPress={handlePreviewCamera}>
                      <MaterialIcons name="videocam" size={18} color="#FFFFFF" />
                      <Text style={styles.recordClipButtonText}>Open Preview</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {inferenceError ? (
              <View style={styles.inferenceErrorBanner} accessibilityRole="alert">
                <MaterialIcons name="error-outline" size={18} color="#fca5a5" />
                <Text style={styles.inferenceErrorText}>{inferenceError}</Text>
              </View>
            ) : null}

            <View style={styles.bottomResponsesArea}>
              <View style={styles.commonResponsesHeaderRow}>
                <Text style={styles.commonResponsesHeaderText}>Common Responses</Text>
                {showCommonResponses ? (
                  <Pressable
                    style={styles.commonResponsesInfoButton}
                    onPress={() => setShowCommonResponsesInfo((prev) => !prev)}
                  >
                    <MaterialIcons name="info-outline" size={14} color={asl.accentCyan} />
                  </Pressable>
                ) : null}
              </View>
              {!showCommonResponses ? (
                <View style={styles.commonResponsesInfoPopup}>
                  <Text style={styles.commonResponsesInfoPopupText}>
                    Suggested follow-up signs based on your recent recognized output. Tap the Responses arrow to
                    show or hide them.
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
                      <MaterialIcons name="image" size={20} color={asl.text.muted} />
                      <Text style={styles.commonResponseImageLabel}>{item}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {translationHistory.length > 0 ? (
                <Pressable
                  style={styles.recentHistoryLink}
                  onPress={() => router.push("/translate/history" as any)}
                >
                  <MaterialIcons name="history" size={16} color={asl.accentCyan} />
                  <Text style={styles.recentHistoryLinkText}>
                    Recent translations ({translationHistory.length})
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color={asl.text.muted} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    mainScroll: {
      flex: 1,
      minHeight: 0,
    },
    mainScrollContent: {
      flexGrow: 1,
      paddingBottom: ms(100),
    },
    contentInner: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(8),
    },
    loadingOverlay: {
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      borderRadius: asl.radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      ...asl.shadow.card,
    },
    loadingText: {
      ...Typography.caption,
      color: asl.text.secondary,
      fontWeight: fontWeight.medium,
      fontSize: ts(14),
      lineHeight: ts(20),
    },
    topSection: {
      flex: 1,
      flexDirection: "row",
      marginTop: Spacing.md,
      minHeight: 0,
    },
    inferenceErrorBanner: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      padding: Spacing.sm,
      borderRadius: asl.radius.md,
      backgroundColor: "rgba(214, 64, 69, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(214, 64, 69, 0.35)",
    },
    inferenceErrorText: {
      ...Typography.caption,
      flex: 1,
      color: "#fecaca",
      fontSize: ts(14),
      lineHeight: ts(20),
    },
    videoCard: {
      flex: 1,
      width: "100%",
      borderRadius: ms(20),
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      ...asl.shadow.card,
    },
    videoStage: {
      width: "100%",
      aspectRatio: 4 / 5,
      position: "relative",
      backgroundColor: "rgba(0,0,0,0.25)",
    },
    cameraPreview: {
      ...StyleSheet.absoluteFillObject,
    },
    videoPlaceholderWrap: {
      ...StyleSheet.absoluteFillObject,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
    },
    videoPlaceholderTitle: {
      ...Typography.sectionTitle,
      color: asl.text.primary,
      marginTop: Spacing.xs,
      textAlign: "center",
      fontSize: ts(20),
      lineHeight: ts(26),
    },
    videoPlaceholderSubtitle: {
      ...Typography.caption,
      color: asl.text.muted,
      marginTop: ms(6),
      textAlign: "center",
      fontSize: ts(14),
      lineHeight: ts(20),
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
      backgroundColor: "rgba(20, 34, 31, 0.35)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.22)",
    },
    smallControlBtnOverlay: {
      width: ms(34),
      height: ms(34),
      borderRadius: ms(17),
      backgroundColor: "rgba(44, 93, 86, 0.55)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    sequenceProgressVerticalOverlay: {
      position: "absolute",
      left: Spacing.sm,
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
      backgroundColor: asl.accentCyan,
    },
    captionsStrip: {
      width: "100%",
      backgroundColor: "rgba(12, 28, 24, 0.92)",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.12)",
    },
    captionsStripInner: {
      flexDirection: "row",
      alignItems: "stretch",
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.sm,
      gap: Spacing.sm,
    },
    captionsStripScroll: {
      flex: 1,
      minWidth: 0,
      maxHeight: ms(96),
    },
    captionsStripScrollContent: {
      flexGrow: 1,
      paddingVertical: 2,
    },
    captionsStripActions: {
      justifyContent: "center",
      gap: Spacing.xs,
    },
    captionsStripIconBtn: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: "rgba(44, 93, 86, 0.75)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
      alignItems: "center",
      justifyContent: "center",
    },
    captionsStripIconBtnDanger: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: "rgba(214, 64, 69, 0.35)",
      borderWidth: 1,
      borderColor: "rgba(214, 64, 69, 0.5)",
      alignItems: "center",
      justifyContent: "center",
    },
    captionsOutputText: {
      ...Typography.body,
      color: "#FFFFFF",
      fontSize: ts(17),
      lineHeight: ts(24),
      fontWeight: fontWeight.emphasis,
    },
    captionsOutputPlaceholderText: {
      ...Typography.caption,
      color: "rgba(255,255,255,0.88)",
      fontSize: ts(14),
      lineHeight: ts(20),
    },
    controlsStrip: {
      width: "100%",
      paddingHorizontal: Spacing.sm,
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.sm,
      alignItems: "center",
      backgroundColor: "rgba(0,0,0,0.35)",
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "rgba(255,255,255,0.08)",
    },
    bottomVideoControlsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      maxWidth: "100%",
    },
    commonResponsesControlArrow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: ms(12),
      minHeight: ms(40),
      paddingVertical: ms(8),
      borderRadius: ms(20),
      backgroundColor: "rgba(44, 93, 86, 0.86)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.45)",
      justifyContent: "center",
    },
    commonResponsesControlArrowLabel: {
      ...Typography.caption,
      color: "#FFFFFF",
      fontWeight: fontWeight.strong,
      fontSize: ts(13),
      lineHeight: ts(18),
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
      color: asl.text.primary,
      fontWeight: fontWeight.strong,
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    commonResponsesInfoPopup: {
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      borderRadius: 10,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    commonResponsesInfoPopupText: {
      ...Typography.caption,
      color: asl.text.secondary,
      fontSize: ts(12),
      lineHeight: ts(17),
    },
    commonResponsesInfoButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
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
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xs,
      padding: Spacing.sm,
    },
    commonResponseImageLabel: {
      ...Typography.caption,
      color: asl.text.primary,
      fontWeight: fontWeight.strong,
      textAlign: "center",
      fontSize: ts(13),
      lineHeight: ts(18),
    },
    recentHistoryLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(8),
      marginTop: ms(8),
      paddingVertical: ms(10),
      paddingHorizontal: ms(12),
      borderRadius: ms(12),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
    },
    recentHistoryLinkText: {
      ...Typography.caption,
      flex: 1,
      color: asl.accentCyan,
      fontWeight: fontWeight.medium,
      fontSize: ts(13),
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
      backgroundColor: "rgba(236, 72, 153, 0.75)",
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
      fontWeight: fontWeight.strong,
      fontSize: ts(13),
      lineHeight: ts(18),
    },
    recordClipButtonText: {
      ...Typography.caption,
      color: "#FFFFFF",
      fontWeight: fontWeight.strong,
      fontSize: ts(14),
      lineHeight: ts(20),
    },
  });
};
