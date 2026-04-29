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
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { CameraView } from "expo-camera";
import { Spacing, Typography, getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { AppShell, AslTabHeader, GlassCard, TranslationOverlay } from "@/src/components/asl";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { fontFamily } from "@/src/theme";
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
    <View style={styles.sideColumn}>
      <Text style={styles.sideColumnLabel}>Ideas</Text>
      <GlassCard style={styles.responsesPanel} contentStyle={styles.responsesPanelInner}>
        <Pressable
          style={styles.recentTranslationsBtn}
          onPress={onOpenRecent}
          accessibilityRole="button"
          accessibilityLabel="View all recent translations"
        >
          <MaterialIcons name="history" size={18} color={asl.accentCyan} />
          <Text style={styles.recentTranslationsBtnText}>Recent</Text>
          {historyCount > 0 ? (
            <View style={styles.recentCountPill}>
              <Text style={styles.recentCountPillText}>{historyCount}</Text>
            </View>
          ) : null}
          <MaterialIcons name="chevron-right" size={20} color={asl.text.muted} />
        </Pressable>
        <Text style={styles.responsesTitle}>Common responses</Text>
        {items.map((item) => (
          <View key={item} style={styles.responseItem}>
            <MaterialIcons name="tips-and-updates" size={16} color={asl.accentCyan} />
            <Text style={styles.responseText} numberOfLines={2}>
              {item}
            </Text>
          </View>
        ))}
        <Text style={styles.responsesHint}>Placeholders · GIFs later</Text>
      </GlassCard>
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
  const [sequenceChunkIndex, setSequenceChunkIndex] = useState(0);
  const [sequencePrompt, setSequencePrompt] = useState<"sign-now" | "move-next" | null>(null);
  const [nextChunkStartsInMs, setNextChunkStartsInMs] = useState(0);
  const [stopAfterCurrentInference, setStopAfterCurrentInference] = useState(false);
  const [showCommonResponses, setShowCommonResponses] = useState(false);
  const [inferenceError, setInferenceError] = useState<string | null>(null);
  const [isTranslateInitializing, setIsTranslateInitializing] = useState(true);
  const { captionText, tokens, append, clear, replaceCaptionFromText } = useCaptionBuffer(30);
  const {
    translationHistory,
    addHistoryItem,
    sessionId,
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
  const chunkProgress = Math.max(0, Math.min(1, recordingElapsedMs / CHUNK_DURATION_MS));
  const nextChunkSecondsText = `${Math.max(0, nextChunkStartsInMs / 1000).toFixed(1)}s`;
  const prepProgress = Math.max(
    0,
    Math.min(1, 1 - nextChunkStartsInMs / Math.max(1, BETWEEN_CHUNKS_MS))
  );
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

  const hasReportableCaption = captionText.trim().length > 0;

  return (
    <AppShell
      scroll={false}
      header={
        <AslTabHeader
          title="Translate"
          rightExtra={
            <Pressable
              onPress={() => router.push("/translate/history" as any)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Translation history"
            >
              <MaterialIcons name="history" size={24} color={asl.text.secondary} />
            </Pressable>
          }
        />
      }
    >
      <View style={styles.content}>
        {isTranslateInitializing ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="small" color={asl.accentCyan} />
            <Text style={styles.loadingText}>Preparing translate…</Text>
          </View>
        ) : null}

        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.sectionLabel, styles.sectionLabelFlush]}>Live preview</Text>
          <View style={styles.topSection}>
            <View style={styles.previewColumn}>
              <View style={styles.previewChromeRow}>
                <View style={styles.langBarShrink}>
                  <TranslationOverlay topLeft={TRANSLATE_SOURCE_LANG} topRight={TRANSLATE_TARGET_LANG} />
                </View>
                <View style={styles.previewCamIconRow}>
                  <Pressable
                    style={({ pressed }) => [styles.chromeIconBtn, pressed && { opacity: 0.75 }]}
                    onPress={toggleCamera}
                  >
                    <MaterialIcons
                      name={cameraActive ? "videocam-off" : "videocam"}
                      size={18}
                      color={asl.accentCyan}
                    />
                  </Pressable>
                  {Platform.OS !== "web" ? (
                    <Pressable
                      style={({ pressed }) => [styles.chromeIconBtn, pressed && { opacity: 0.75 }]}
                      onPress={reverseCamera}
                    >
                      <MaterialIcons name="flip-camera-ios" size={18} color={asl.accentCyan} />
                    </Pressable>
                  ) : null}
                </View>
              </View>

              <View style={styles.videoSurface}>
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
              </View>

              {cameraActive && isRecordingClip ? (
                <View style={styles.recordingProgressSection} pointerEvents="none">
                  <View style={styles.recordingProgressTrack}>
                    <View
                      style={[
                        styles.recordingProgressFill,
                        {
                          width:
                            sequencePrompt === "move-next" ? `${prepProgress * 100}%` : `${chunkProgress * 100}%`,
                          backgroundColor:
                            sequencePrompt === "move-next" ? prepTransitionColor : asl.accentCyan,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.liveCaptionBar}>
                <ScrollView
                  style={styles.liveCaptionScroll}
                  contentContainerStyle={styles.liveCaptionScrollContent}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text
                    style={
                      captionText.length > 0 ? styles.captionsOutputText : styles.captionsOutputPlaceholderText
                    }
                  >
                    {captionOutput}
                  </Text>
                </ScrollView>
                <View style={styles.liveCaptionActions}>
                  <Pressable style={styles.liveCaptionIconBtn} onPress={handleToggleVolume}>
                    <MaterialIcons
                      name={isVolumeOn ? "volume-up" : "volume-off"}
                      size={18}
                      color={asl.accentCyan}
                    />
                  </Pressable>
                  <Pressable style={styles.liveCaptionIconBtnDanger} onPress={handleClearCaptions}>
                    <MaterialIcons name="delete-outline" size={18} color="#FCA5A5" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.liveActionsRow}>
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
                      style={styles.commonResponsesControlArrow}
                      onPress={() => setShowCommonResponses((prev) => !prev)}
                    >
                      <Text style={styles.commonResponsesControlArrowLabel}>Responses</Text>
                      <MaterialIcons
                        name={showCommonResponses ? "keyboard-arrow-down" : "keyboard-arrow-up"}
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

            <CommonResponsesPlaceholder
              styles={styles}
              historyCount={translationHistory.length}
              onOpenRecent={() => router.push("/translate/history" as any)}
            />
          </View>

          <Text style={styles.sectionLabel}>Translation output</Text>
          <GlassCard style={styles.outputCard}>
            <ScrollView
              style={styles.outputScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.outputScrollContent}
            >
              <Text
                style={
                  captionText.length > 0 ? styles.captionsOutputTextPrimary : styles.captionsOutputPlaceholderPrimary
                }
              >
                {captionOutput}
              </Text>
            </ScrollView>

            <View style={styles.outputActionsRow}>
              <Pressable
                style={[styles.outputChipBtn, !hasReportableCaption && styles.outputChipBtnDisabled]}
                onPress={openReportForCurrentOutput}
                disabled={!hasReportableCaption}
                accessibilityRole="button"
                accessibilityLabel="Report incorrect translation"
                accessibilityState={{ disabled: !hasReportableCaption }}
              >
                <MaterialIcons
                  name="flag"
                  size={18}
                  color={hasReportableCaption ? asl.accentCyan : asl.text.muted}
                />
                <Text
                  style={[
                    styles.outputChipBtnText,
                    !hasReportableCaption && styles.outputChipBtnTextDisabled,
                  ]}
                >
                  Report
                </Text>
              </Pressable>
              <Pressable style={styles.outputChipBtn} onPress={handleClearCaptions} accessibilityRole="button">
                <MaterialIcons name="delete-outline" size={18} color={asl.accentCyan} />
                <Text style={styles.outputChipBtnText}>Clear</Text>
              </Pressable>
            </View>

            <Text style={styles.statusLinePrimary}>{inferenceStatus}</Text>
            <Text style={styles.statusLineSecondary}>{confidenceSummary}</Text>
            {__DEV__ ? (
              <View style={styles.devMetaBlock}>
                <Text style={styles.devMetaText}>
                  Mode: {lastInference?.mode ?? "single"} · Tokens: {lastInference?.tokens.length ?? 0} ·{" "}
                  {lastInference?.adapter_name ?? "—"} · Caption tokens: {tokens.length} ·{" "}
                  {isVolumeOn ? "Sound on" : "Muted"}
                </Text>
              </View>
            ) : null}
          </GlassCard>
        </ScrollView>
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
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding,
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
      fontWeight: "600",
      fontFamily: fontFamily.body,
    },
    mainScroll: {
      flex: 1,
      minHeight: 0,
    },
    mainScrollContent: {
      paddingBottom: ms(112),
      paddingTop: ms(4),
    },
    sectionLabel: {
      fontFamily: fontFamily.medium,
      color: asl.text.muted,
      fontSize: ts(11),
      letterSpacing: 1.2,
      textTransform: "uppercase",
      marginTop: ms(16),
      marginBottom: ms(8),
    },
    sectionLabelFlush: {
      marginTop: ms(4),
    },
    topSection: {
      flexDirection: "row",
      gap: ms(10),
      alignItems: "stretch",
    },
    previewColumn: {
      flex: 1,
      minWidth: 0,
      gap: ms(10),
    },
    previewChromeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(8),
    },
    langBarShrink: {
      flex: 1,
      minWidth: 0,
    },
    previewCamIconRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(6),
      flexShrink: 0,
    },
    chromeIconBtn: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
    },
    videoSurface: {
      width: "100%",
      aspectRatio: 4 / 5,
      borderRadius: ms(18),
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.35)",
      borderWidth: 1,
      borderColor: asl.glass.border,
      ...asl.shadow.card,
    },
    cameraPreview: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    videoPlaceholderWrap: {
      flex: 1,
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: Spacing.md,
      minHeight: ms(140),
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
    recordingProgressSection: {
      width: "100%",
      marginTop: ms(2),
    },
    recordingProgressTrack: {
      height: ms(6),
      borderRadius: ms(99),
      backgroundColor: "rgba(255,255,255,0.14)",
      overflow: "hidden",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "rgba(255,255,255,0.22)",
    },
    recordingProgressFill: {
      height: "100%",
      borderRadius: ms(99),
    },
    liveCaptionBar: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: ms(10),
      paddingVertical: ms(10),
      paddingHorizontal: ms(12),
      borderRadius: ms(14),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      minHeight: ms(76),
      ...asl.shadow.card,
    },
    liveCaptionScroll: {
      flex: 1,
      minHeight: 0,
      maxHeight: ms(80),
    },
    liveCaptionScrollContent: {
      paddingBottom: ms(4),
      flexGrow: 1,
    },
    liveCaptionActions: {
      justifyContent: "center",
      gap: ms(8),
      flexShrink: 0,
    },
    liveCaptionIconBtn: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255,255,255,0.08)",
      borderWidth: 1,
      borderColor: asl.glass.border,
    },
    liveCaptionIconBtnDanger: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(239,68,68,0.15)",
      borderWidth: 1,
      borderColor: "rgba(248,113,113,0.45)",
    },
    liveActionsRow: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      paddingBottom: ms(4),
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
      backgroundColor: "rgba(44, 93, 86, 0.86)",
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
    flex: 1,
    width: "100%",
    minHeight: ms(140),
    alignSelf: "stretch",
  },
  responsesPanelInner: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: ms(6),
    justifyContent: "flex-start",
  },
  sideColumn: {
    width: "26%",
    maxWidth: ms(148),
    minWidth: ms(112),
    flexShrink: 0,
    flexGrow: 0,
    alignSelf: "stretch",
    minHeight: 0,
    justifyContent: "flex-start",
  },
  sideColumnLabel: {
    fontFamily: fontFamily.medium,
    color: asl.text.muted,
    fontSize: ts(11),
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: ms(8),
  },
  outputCard: {
    marginBottom: ms(8),
  },
  outputScroll: {
    maxHeight: ms(120),
  },
  outputScrollContent: {
    paddingBottom: ms(4),
  },
  captionsOutputTextPrimary: {
    ...Typography.body,
    color: asl.text.primary,
    fontSize: ts(17),
    lineHeight: ts(24),
    fontWeight: "700",
    fontFamily: fontFamily.heading,
    minHeight: ms(48),
  },
  captionsOutputPlaceholderPrimary: {
    ...Typography.caption,
    color: asl.text.secondary,
    fontSize: ts(14),
    lineHeight: ts(20),
    fontFamily: fontFamily.body,
    minHeight: ms(48),
  },
  outputActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: ms(10),
    marginTop: ms(14),
    marginBottom: ms(10),
    paddingTop: ms(12),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: asl.glass.border,
  },
  outputChipBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    paddingVertical: ms(10),
    paddingHorizontal: ms(14),
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  outputChipBtnDisabled: {
    opacity: 0.55,
  },
  outputChipBtnText: {
    fontFamily: fontFamily.medium,
    color: asl.accentCyan,
    fontSize: ts(14),
  },
  outputChipBtnTextDisabled: {
    color: asl.text.muted,
  },
  statusLinePrimary: {
    ...Typography.caption,
    color: asl.text.secondary,
    fontSize: ts(13),
    lineHeight: ts(19),
    fontFamily: fontFamily.medium,
  },
  statusLineSecondary: {
    ...Typography.caption,
    color: asl.text.muted,
    fontSize: ts(11),
    lineHeight: ts(15),
    marginTop: ms(6),
    fontFamily: fontFamily.body,
  },
  devMetaBlock: {
    marginTop: ms(12),
    padding: ms(10),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,165,0,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
  },
  devMetaText: {
    fontSize: ts(10),
    lineHeight: ts(14),
    color: asl.text.muted,
    fontFamily: fontFamily.body,
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
    flexDirection: "row",
    alignItems: "center",
    borderRadius: ms(12),
    backgroundColor: "rgba(0,0,0,0.2)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    minHeight: ms(44),
    marginBottom: Spacing.xs,
    paddingVertical: ms(6),
    paddingHorizontal: ms(8),
    gap: ms(6),
  },
  responseText: {
    ...Typography.caption,
    flex: 1,
    color: asl.text.primary,
    fontWeight: "600",
    fontSize: ts(11),
    lineHeight: ts(15),
  },
  responsesHint: {
    ...Typography.caption,
    color: asl.text.muted,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: ts(10),
    lineHeight: ts(13),
  },
    captionsOutputText: {
      ...Typography.body,
      color: asl.text.primary,
      fontSize: ts(14),
      lineHeight: ts(19),
      fontWeight: "700",
      fontFamily: fontFamily.heading,
      minHeight: ms(44),
    },
    captionsOutputPlaceholderText: {
      ...Typography.caption,
      color: asl.text.muted,
      fontSize: ts(11),
      lineHeight: ts(15),
      fontFamily: fontFamily.body,
      minHeight: ms(44),
    },
  });
};