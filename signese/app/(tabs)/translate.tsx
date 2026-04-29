import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { CameraView } from "expo-camera";
import { Spacing, Typography, getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { AppShell, AslTabHeader, ToggleSwitch, TranslationOverlay } from "@/src/components/asl";
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
import {
  ReportTranslationModal,
  type ReportTranslationContext,
} from "@/src/features/translate/ui/ReportTranslationModal";

function CommonResponsesPlaceholder({
  styles,
  historyCount,
  onOpenRecent,
}: {
  styles: ReturnType<typeof createStyles>;
  historyCount: number;
  onOpenRecent: () => void;
}) {
  const items = useMemo(() => GREETING_INTRO_V0_LABELS.slice(0, 3), []);

  return (
    <View style={styles.responsesPanel}>
      <Pressable
        style={styles.recentTranslationsBtn}
        onPress={onOpenRecent}
        accessibilityRole="button"
        accessibilityLabel="View all recent translations"
      >
        <MaterialIcons name="history" size={18} color={asl.accentCyan} />
        <Text style={styles.recentTranslationsBtnText}>Recent translations</Text>
        {historyCount > 0 ? (
          <View style={styles.recentCountPill}>
            <Text style={styles.recentCountPillText}>{historyCount}</Text>
          </View>
        ) : null}
        <MaterialIcons name="chevron-right" size={20} color={asl.text.muted} />
      </Pressable>
      <Text style={styles.responsesTitle}>Common Responses</Text>
      {items.map((item) => (
        <View key={item} style={styles.responseItem}>
          <MaterialIcons name="image" size={16} color={asl.text.muted} />
          <Text style={styles.responseText}>{item}</Text>
        </View>
      ))}
      <Text style={styles.responsesHint}>Suggested signs/GIFs</Text>
    </View>
  );
}

export default function TranslateScreen() {
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
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isTranslateInitializing, setIsTranslateInitializing] = useState(true);
  const { captionText, tokens, append, clear, replaceCaptionFromText } = useCaptionBuffer(30);
  const {
    translationHistory,
    addHistoryItem,
    sessionId,
    keepHistoryOnDevice,
    setKeepHistoryOnDevice,
    historyPrefsLoaded,
    consumePendingReuseCaption,
  } = useTabTranslationHistory();
  const lastHistoryEntryIdRef = useRef<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<ReportTranslationContext | null>(null);
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
  const recordingPromiseRef = useRef<Promise<{ uri: string } | undefined> | null>(null);

  const shortClipService = useMemo<ShortClipInferenceService>(() => {
    return createShortClipInferenceService(RUNTIME_V0_LABELS);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const text = consumePendingReuseCaption();
      if (text != null && text.length > 0) {
        replaceCaptionFromText(text);
        setLastDecision(null);
        setLastInference(null);
        setInferenceError(null);
      }
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

        if (Platform.OS !== "web") {
          const recorder = cameraRef.current as any;
          if (!recorder?.recordAsync) {
            setInferenceError("Video recording is not available on this device.");
            setIsRecordingClip(false);
          } else {
            recordingPromiseRef.current = recorder.recordAsync({
              maxDuration: 6,
              quality: "480p",
              mute: true,
            });
          }
        }
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
      const clipDurationMs = Math.max(recordingElapsedMs, 0);

      let response: TranslateInferenceResponse;
      if (Platform.OS !== "web") {
        const recorder = cameraRef.current as any;
        if (recorder?.stopRecording) {
          recorder.stopRecording();
        }

        const recordingResult = recordingPromiseRef.current
          ? await recordingPromiseRef.current
          : undefined;
        recordingPromiseRef.current = null;

        if (!recordingResult?.uri) {
          throw new Error("No recorded clip was captured.");
        }

        response = await shortClipService.inferRecordedClip({
          sequence: sequenceRef.current,
          clipUri: recordingResult.uri,
          startMs: 0,
          endMs: clipDurationMs,
        });
      } else {
        const derivedFps = Math.max(
          10,
          Math.min(16, Math.round((recordingElapsedMs || 1200) / 100))
        );
        const derivedFrameCount = Math.max(
          8,
          Math.min(48, Math.round((Math.max(clipDurationMs, 400) / 1000) * derivedFps))
        );

        // Web fallback keeps the previous mocked path until browser recording uploads are implemented.
        response = await shortClipService.inferShortClip({
        sequence: sequenceRef.current,
        frameCount: derivedFrameCount,
        fps: derivedFps,
        });
      }

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

      const clipLabels = response.tokens.map((t) => t.label);
      const hasHistorySignal =
        clipLabels.length > 0 || (response.raw_top_k && response.raw_top_k.length > 0);
      if (hasHistorySignal) {
        const originalText =
          clipLabels.length > 0
            ? clipLabels.join(" ")
            : (response.raw_top_k?.[0]?.label ?? "No prediction");
        const prevCaption = captionText.trim();
        const translatedText =
          clipLabels.length > 0
            ? prevCaption
              ? `${prevCaption} ${clipLabels.join(" ")}`
              : clipLabels.join(" ")
            : prevCaption.length > 0
              ? prevCaption
              : "—";
        const newId = addHistoryItem({
          originalText,
          translatedText,
          sourceLanguage: TRANSLATE_SOURCE_LANG,
          targetLanguage: TRANSLATE_TARGET_LANG,
        });
        lastHistoryEntryIdRef.current = newId;
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

  const openReportForCurrentOutput = useCallback(() => {
    const cap = captionText.trim();
    if (!cap) {
      return;
    }
    const clipPart =
      lastInference?.tokens.map((t) => t.label).join(" ").trim() || lastDecision?.token?.label || "";
    const sourceText = clipPart.length > 0 ? clipPart : "—";
    setReportContext({
      translationId: lastHistoryEntryIdRef.current ?? undefined,
      sourceText,
      translatedText: cap,
      sourceLanguage: TRANSLATE_SOURCE_LANG,
      targetLanguage: TRANSLATE_TARGET_LANG,
      sessionId,
    });
    setReportOpen(true);
  }, [captionText, lastDecision?.token?.label, lastInference?.tokens, sessionId]);

  const recordingSecondsText = `${(recordingElapsedMs / 1000).toFixed(1)}s`;
  const cooldownSecondsText = `${(cooldownRemainingMs / 1000).toFixed(1)}s`;

  const permissionDenied = permission && !permission.granted;
  const captionOutput = captionText.length > 0 ? captionText : "Translation output will appear here.";
  const hasReportableCaption = captionText.trim().length > 0;
  const inferenceStatus =
    isRecordCooldown
      ? `Get ready... recording starts in ${cooldownSecondsText}`
      : isRecordingClip
      ? "Recording short clip... tap Stop & Infer when finished."
      : isInferring
      ? "Running short-clip inference..."
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
    <AppShell scroll={false} header={<AslTabHeader title="Translate" />}>
      <View style={styles.content}>
        {isTranslateInitializing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={asl.accentCyan} />
            <Text style={styles.loadingText}>Preparing Translate...</Text>
          </View>
        ) : null}

        <View style={styles.topSection}>
          <View style={styles.videoCard}>
            <View style={styles.langOverlay}>
              <TranslationOverlay topLeft={TRANSLATE_SOURCE_LANG} topRight={TRANSLATE_TARGET_LANG} />
            </View>
            {cameraActive && permission?.granted ? (
              <CameraView ref={cameraRef} style={styles.cameraPreview} facing={cameraFacing} mode="video" />
            ) : (
              <View style={styles.videoPlaceholderWrap}>
                <MaterialIcons name="videocam" size={34} color={asl.text.secondary} />
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

          <CommonResponsesPlaceholder
            styles={styles}
            historyCount={translationHistory.length}
            onOpenRecent={() => router.push("/translate/history" as any)}
          />
        </View>

        <View style={styles.historyToggle}>
          <ToggleSwitch
            value={keepHistoryOnDevice}
            onValueChange={setKeepHistoryOnDevice}
            label="Keep history on device"
            description="Stores recent translations locally on this phone."
          />
          {!historyPrefsLoaded ? (
            <Text style={styles.historyToggleHint}>Loading preference…</Text>
          ) : null}
        </View>

        <View style={styles.captionsControlsRow}>
          <View style={styles.leftControlsWrap}>
            <Pressable style={styles.smallControlBtn} onPress={toggleCamera}>
              <MaterialIcons
                name={cameraActive ? "videocam-off" : "videocam"}
                size={18}
                color={asl.accentCyan}
              />
            </Pressable>
            {Platform.OS !== "web" ? (
              <Pressable style={styles.smallControlBtn} onPress={reverseCamera}>
                <MaterialIcons name="flip-camera-ios" size={18} color={asl.accentCyan} />
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
                color={asl.accentCyan}
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.captionsCard}>
          <Text style={styles.captionsOutputText}>{captionOutput}</Text>
          <View style={styles.captionOutputActions}>
            <Pressable
              style={[styles.reportOutputBtn, !hasReportableCaption && styles.reportOutputBtnDisabled]}
              onPress={openReportForCurrentOutput}
              disabled={!hasReportableCaption}
              accessibilityRole="button"
              accessibilityLabel="Report incorrect translation"
              accessibilityState={{ disabled: !hasReportableCaption }}
            >
              <MaterialIcons
                name="flag"
                size={16}
                color={hasReportableCaption ? asl.accentCyan : asl.text.muted}
              />
              <Text
                style={[
                  styles.reportOutputBtnText,
                  !hasReportableCaption && styles.reportOutputBtnTextDisabled,
                ]}
              >
                Report
              </Text>
            </Pressable>
          </View>
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
            <MaterialIcons name="delete-outline" size={16} color={asl.accentCyan} />
            <Text style={styles.clearCaptionsButtonText}>Clear captions</Text>
          </Pressable>
        </View>
      </View>

      <ReportTranslationModal
        visible={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportContext(null);
        }}
        context={reportContext}
      />
    </AppShell>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    content: {
      flex: 1,
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: 100,
    },
    loadingOverlay: {
      marginTop: Spacing.sm,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    loadingText: {
      ...Typography.caption,
      color: asl.text.secondary,
      fontWeight: "600",
    },
  topSection: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    videoCard: {
      flex: 1,
      minHeight: ms(250),
      borderRadius: ms(20),
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      position: "relative",
    },
    langOverlay: {
      position: "absolute",
      top: ms(10),
      left: ms(10),
      right: ms(10),
      zIndex: 2,
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
      color: asl.text.primary,
      marginTop: Spacing.xs,
      textAlign: "center",
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    videoPlaceholderSubtitle: {
      ...Typography.caption,
      color: asl.text.muted,
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
      zIndex: 2,
    },
    recordClipButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: "rgba(219, 39, 119, 0.92)",
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.35)",
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
      borderColor: "rgba(255,255,255,0.35)",
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
    width: ms(136),
    minHeight: ms(250),
    borderRadius: ms(18),
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  recentTranslationsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
    borderRadius: ms(12),
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    paddingVertical: ms(8),
    paddingHorizontal: ms(6),
    marginBottom: Spacing.sm,
  },
  recentTranslationsBtnText: {
    ...Typography.caption,
    flex: 1,
    flexShrink: 1,
    color: asl.text.primary,
    fontWeight: "700",
    fontSize: ts(11),
    lineHeight: ts(14),
  },
  recentCountPill: {
    minWidth: ms(20),
    paddingHorizontal: ms(5),
    paddingVertical: ms(2),
    borderRadius: ms(10),
    backgroundColor: "rgba(56, 189, 248, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  recentCountPillText: {
    ...Typography.caption,
    fontSize: ts(10),
    fontWeight: "800",
    color: asl.accentCyan,
  },
  responsesTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: asl.text.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
    fontSize: ts(12),
    lineHeight: ts(16),
  },
  responseItem: {
    borderRadius: ms(12),
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    minHeight: ms(52),
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    paddingVertical: ms(6),
    gap: ms(4),
  },
  responseText: {
    ...Typography.caption,
    color: asl.text.primary,
    fontWeight: "600",
    fontSize: ts(12),
    lineHeight: ts(16),
  },
  responsesHint: {
    ...Typography.caption,
    color: asl.text.muted,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: ts(10),
    lineHeight: ts(13),
  },
  historyToggle: {
    marginTop: Spacing.md,
  },
  historyToggleHint: {
    ...Typography.caption,
    color: asl.text.muted,
    marginTop: 4,
    fontSize: ts(11),
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
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
    },
    captionsLabel: {
      ...Typography.sectionTitle,
      color: asl.text.primary,
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    captionsCard: {
      marginTop: Spacing.sm,
      flex: 1,
      flexShrink: 1,
      minHeight: ms(160),
      borderRadius: ms(18),
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.22)",
      padding: Spacing.md,
    },
    captionsOutputText: {
      ...Typography.body,
      color: asl.text.primary,
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
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
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: asl.glass.border,
    },
    reportOutputBtnDisabled: {
      opacity: 0.65,
    },
    reportOutputBtnText: {
      ...Typography.caption,
      color: asl.accentCyan,
      fontWeight: "700",
    },
    reportOutputBtnTextDisabled: {
      color: asl.text.muted,
    },
    captionsSubText: {
      ...Typography.caption,
      color: asl.text.muted,
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
      backgroundColor: "rgba(255,255,255,0.08)",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: asl.glass.border,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    clearCaptionsButtonText: {
      ...Typography.caption,
      color: asl.accentCyan,
      fontWeight: "700",
    },
  });
};