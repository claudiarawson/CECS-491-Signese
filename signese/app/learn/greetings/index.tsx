import React, { useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { asl } from "@/src/theme/aslConnectTheme";
import { useLessonPalette, type LessonPalette } from "@/src/contexts/ThemeContext";
import {
  fontWeight,
  getDeviceDensity,
  moderateScale,
  Spacing} from "@/src/theme";
import {
  GREETINGS_LEARN_ITEMS,
  GREETINGS_BATCH_1,
  GREETINGS_BATCH_2,
  type GreetingLearnItem} from "@/src/features/learn/data/greetings";

// ─── Lesson flow ─────────────────────────────────────────────────────────────
// Steps 1–4  : Learn signs 1-4  (Batch 1)
// Step  5    : Match Batch 1
// Steps 6–8  : Learn signs 5-7  (Batch 2 first 3)
// Step  9    : Match Batch 2
// Step  10   : Complete
// ─────────────────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 10;

type Phase = "learn" | "match";

function getPhaseAndIndex(step: number): { phase: Phase; batchIndex: number; learnIndex: number } {
  if (step <= 4) return { phase: "learn", batchIndex: 0, learnIndex: step - 1 };
  if (step === 5) return { phase: "match", batchIndex: 0, learnIndex: 0 };
  if (step <= 8) return { phase: "learn", batchIndex: 1, learnIndex: step - 6 };
  if (step === 9) return { phase: "match", batchIndex: 1, learnIndex: 0 };
  return { phase: "learn", batchIndex: -1, learnIndex: -1 }; // step 10 = complete (handled externally)
}

function getProgressLabel(step: number): string {
  if (step === 5 || step === 9) return "Match";
  return "Learn";
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Match state helpers ─────────────────────────────────────────────────────
type TileState = "default" | "selected" | "correct" | "wrong";

interface MatchTile {
  id: string;
  label: string;
  image: any;
  state: TileState;
}

function buildMatchTiles(batch: GreetingLearnItem[]): {
  gifTiles: MatchTile[];
  wordTiles: MatchTile[];
} {
  const gifTiles: MatchTile[] = batch.map((s) => ({
    id: s.id,
    label: s.label,
    image: s.image,
    state: "default"}));
  const wordTiles: MatchTile[] = shuffleArray(
    batch.map((s) => ({ id: s.id, label: s.label, image: s.image, state: "default" as TileState }))
  );
  return { gifTiles, wordTiles };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GreetingsLearnScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = useMemo(() => (v: number) => moderateScale(v) * density, [density]);
  const lc = useLessonPalette();
  const styles = useMemo(() => createStyles(ms, lc), [ms, lc]);

  const headerRight = (
    <>
      <Pressable onPress={() => router.push("/(tabs)/settings" as any)} hitSlop={8} style={styles.headerIcon}>
        <MaterialIcons name="settings" size={24} color="#000000" />
      </Pressable>
      <Pressable onPress={() => router.push("/(tabs)/account")} hitSlop={8} style={styles.headerIcon}>
        <MaterialIcons name="account-circle" size={26} color="#000000" />
      </Pressable>
    </>
  );

  // ── Step state ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [totalCorrect, setTotalCorrect] = useState(0);

  // ── Match state ─────────────────────────────────────────────────────────────
  const [gifTiles, setGifTiles] = useState<MatchTile[]>([]);
  const [wordTiles, setWordTiles] = useState<MatchTile[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived state ────────────────────────────────────────────────────────────
  const { phase, batchIndex, learnIndex } = getPhaseAndIndex(step);
  const progressLabel = getProgressLabel(step);
  const progressFill = step / TOTAL_STEPS;
  const currentBatch = batchIndex === 0 ? GREETINGS_BATCH_1 : GREETINGS_BATCH_2;
  const currentLearnItem =
    phase === "learn" && learnIndex >= 0 ? currentBatch[learnIndex] : null;

  const allMatchedInBatch = matchedPairs.size === (currentBatch?.length ?? 0);
  const nextEnabled = phase === "learn" || (phase === "match" && allMatchedInBatch);

  // ── Initialize match tiles when entering a match step ──────────────────────
  function initMatch(batch: GreetingLearnItem[]) {
    const { gifTiles: gTiles, wordTiles: wTiles } = buildMatchTiles(batch);
    setGifTiles(gTiles);
    setWordTiles(wTiles);
    setSelectedGif(null);
    setSelectedWord(null);
    setMatchedPairs(new Set());
    setFeedbackMsg(null);
  }

  // ── Navigate to next step ──────────────────────────────────────────────────
  const handleNext = () => {
    const nextStep = step + 1;
    if (nextStep > TOTAL_STEPS) return;

    if (nextStep === 5) initMatch(GREETINGS_BATCH_1);
    if (nextStep === 9) initMatch(GREETINGS_BATCH_2);

    if (nextStep === 10) {
      router.push({
        pathname: "/learn/greetings/type" as any,
        params: { matchScore: String(totalCorrect) }});
      return;
    }

    setStep(nextStep);
  };

  // ── Match tile logic ────────────────────────────────────────────────────────
  const handleGifTap = (id: string) => {
    if (matchedPairs.has(id)) return;
    if (gifTiles.find((t) => t.id === id)?.state === "correct") return;

    setSelectedGif(id);
    setGifTiles((prev) =>
      prev.map((t) => ({
        ...t,
        state: t.state === "correct" ? "correct" : t.id === id ? "selected" : "default"}))
    );

    if (selectedWord) {
      resolveMatch(id, selectedWord, true);
    }
  };

  const handleWordTap = (id: string) => {
    if (matchedPairs.has(id)) return;
    if (wordTiles.find((t) => t.id === id)?.state === "correct") return;

    setSelectedWord(id);
    setWordTiles((prev) =>
      prev.map((t) => ({
        ...t,
        state: t.state === "correct" ? "correct" : t.id === id ? "selected" : "default"}))
    );

    if (selectedGif) {
      resolveMatch(selectedGif, id, false);
    }
  };

  const resolveMatch = (gifId: string, wordId: string, gifTappedLast: boolean) => {
    const isCorrect = gifId === wordId;

    if (isCorrect) {
      setMatchedPairs((prev) => new Set([...prev, gifId]));
      setGifTiles((prev) =>
        prev.map((t) => (t.id === gifId ? { ...t, state: "correct" } : t))
      );
      setWordTiles((prev) =>
        prev.map((t) => (t.id === wordId ? { ...t, state: "correct" } : t))
      );
      setTotalCorrect((n) => n + 1);
      setFeedbackMsg("Correct! ✓");
      setFeedbackCorrect(true);
      setSelectedGif(null);
      setSelectedWord(null);
    } else {
      setGifTiles((prev) =>
        prev.map((t) =>
          t.id === gifId && t.state !== "correct" ? { ...t, state: "wrong" } : t
        )
      );
      setWordTiles((prev) =>
        prev.map((t) =>
          t.id === wordId && t.state !== "correct" ? { ...t, state: "wrong" } : t
        )
      );
      setFeedbackMsg("Try again");
      setFeedbackCorrect(false);

      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => {
        setGifTiles((prev) =>
          prev.map((t) => (t.state === "wrong" ? { ...t, state: "default" } : t))
        );
        setWordTiles((prev) =>
          prev.map((t) => (t.state === "wrong" ? { ...t, state: "default" } : t))
        );
        setSelectedGif(null);
        setSelectedWord(null);
        setFeedbackMsg(null);
      }, 700);
    }
  };

  // ── Tile border/bg helpers ──────────────────────────────────────────────────
  const gifTileStyle = (state: TileState) => {
    if (state === "selected") return { borderColor: lc.progressFill, backgroundColor: "rgba(34,211,238,0.14)" };
    if (state === "correct") return { borderColor: lc.success, backgroundColor: "rgba(74,222,128,0.14)" };
    if (state === "wrong") return { borderColor: lc.error, backgroundColor: "rgba(252,165,165,0.14)" };
    return { borderColor: asl.glass.border, backgroundColor: "rgba(255,255,255,0.06)" };
  };

  const wordTileStyle = (state: TileState) => {
    if (state === "selected") return { borderColor: asl.linkPink, backgroundColor: "rgba(236,72,153,0.14)" };
    if (state === "correct") return { borderColor: lc.success, backgroundColor: "rgba(74,222,128,0.14)" };
    if (state === "wrong") return { borderColor: lc.error, backgroundColor: "rgba(252,165,165,0.14)" };
    return { borderColor: asl.glass.border, backgroundColor: "rgba(255,255,255,0.06)" };
  };

  const wordTileTextColor = (state: TileState) => {
    if (state === "correct") return lc.success;
    if (state === "wrong") return lc.error;
    return "#000000";
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <AppShell
      scroll={false}
      header={
        <LearnFlowHeader
          title="Greetings"
          onBackPress={() => (step === 1 ? router.back() : setStep((s) => s - 1))}
          rightExtra={headerRight}
        />
      }
    >
      <View style={styles.shell}>
        {/* Progress strip */}
        <View style={styles.progressStrip}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>{progressLabel}</Text>
            <Text style={styles.progressLabel}>
              {step}/{TOTAL_STEPS}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressFill * 100}%` }]} />
          </View>
        </View>

        {/* Content card + button */}
        <View style={styles.cardWrapper}>
          {phase === "learn" && currentLearnItem ? (
            <LearnCard item={currentLearnItem} styles={styles} />
          ) : null}

          {phase === "match" ? (
            <MatchCard
              gifTiles={gifTiles}
              wordTiles={wordTiles}
              onGifTap={handleGifTap}
              onWordTap={handleWordTap}
              feedbackMsg={feedbackMsg}
              feedbackCorrect={feedbackCorrect}
              feedbackSuccessColor={lc.success}
              feedbackErrorColor={lc.error}
              gifTileStyle={gifTileStyle}
              wordTileStyle={wordTileStyle}
              wordTileTextColor={wordTileTextColor}
              totalCorrect={totalCorrect}
              styles={styles}
            />
          ) : null}
        </View>

        {/* Next button */}
        <View style={styles.buttonRow}>
          <PrimaryActionButton label={step === 9 ? "Finish" : "Next"} onPress={handleNext} disabled={!nextEnabled} />
        </View>
      </View>
    </AppShell>
  );
}

// ─── Learn card sub-component ────────────────────────────────────────────────
function LearnCard({
  item,
  styles}: {
  item: { image: any; label: string };
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.gifArea}>
        <Image source={item.image} style={styles.gifImage} contentFit="cover" autoplay />
      </View>
      <Text style={styles.caption}>Watch and learn this sign</Text>
      <Text style={styles.signWord}>{item.label}</Text>
    </View>
  );
}

// ─── Match card sub-component ────────────────────────────────────────────────
function MatchCard({
  gifTiles,
  wordTiles,
  onGifTap,
  onWordTap,
  feedbackMsg,
  feedbackCorrect,
  feedbackSuccessColor,
  feedbackErrorColor,
  gifTileStyle,
  wordTileStyle,
  wordTileTextColor,
  totalCorrect,
  styles}: {
  gifTiles: MatchTile[];
  wordTiles: MatchTile[];
  onGifTap: (id: string) => void;
  onWordTap: (id: string) => void;
  feedbackMsg: string | null;
  feedbackCorrect: boolean;
  feedbackSuccessColor: string;
  feedbackErrorColor: string;
  gifTileStyle: (s: TileState) => { borderColor: string; backgroundColor: string };
  wordTileStyle: (s: TileState) => { borderColor: string; backgroundColor: string };
  wordTileTextColor: (s: TileState) => string;
  totalCorrect: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.matchTitle}>Match the Sign</Text>
      <Text style={styles.matchScore}>Score: {totalCorrect}</Text>

      <View style={styles.matchGrid}>
        {gifTiles.map((tile, idx) => {
          const wTile = wordTiles[idx];
          return (
            <View key={tile.id} style={styles.matchRow}>
              <Pressable
                style={[
                  styles.gifTile,
                  gifTileStyle(tile.state),
                  { borderWidth: 2 },
                  tile.state === "correct" && styles.tileDisabled,
                ]}
                onPress={() => onGifTap(tile.id)}
                disabled={tile.state === "correct"}
              >
                <Image source={tile.image} style={styles.matchGifImage} contentFit="cover" autoplay />
              </Pressable>
              <Pressable
                style={[
                  styles.wordTile,
                  wordTileStyle(wTile.state),
                  { borderWidth: 2 },
                  wTile.state === "correct" && styles.tileDisabled,
                ]}
                onPress={() => onWordTap(wTile.id)}
                disabled={wTile.state === "correct"}
              >
                <Text
                  style={[
                    styles.wordTileText,
                    { color: wordTileTextColor(wTile.state) },
                  ]}
                  numberOfLines={2}
                >
                  {wTile.label}
                </Text>
              </Pressable>
            </View>
          );
        })}
      </View>

      {/* Feedback pill */}
      <View style={styles.feedbackRow}>
        {feedbackMsg ? (
          <View
            style={[
              styles.feedbackPill,
              feedbackCorrect ? styles.feedbackCorrect : styles.feedbackWrong,
            ]}
          >
            <Text
              style={[
                styles.feedbackText,
                { color: feedbackCorrect ? feedbackSuccessColor : feedbackErrorColor },
              ]}
            >
              {feedbackMsg}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (ms: (v: number) => number, lc: LessonPalette) =>
  StyleSheet.create({
    shell: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding},
    headerIcon: {
      padding: ms(4)},
    progressStrip: {
      paddingTop: ms(8),
      paddingBottom: ms(12)},
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: ms(8)},
    progressLabel: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: "#000000"},
    progressTrack: {
      height: ms(10),
      borderRadius: ms(99),
      backgroundColor: lc.progressBackground,
      overflow: "hidden",
      marginBottom: ms(12)},
    progressFill: {
      height: "100%",
      borderRadius: ms(99),
      backgroundColor: lc.progressFill},
    cardWrapper: {
      flex: 1,
      minHeight: 0},
    card: {
      flex: 1,
      backgroundColor: asl.glass.bg,
      borderRadius: ms(26),
      borderWidth: StyleSheet.hairlineWidth + 1,
      borderColor: asl.glass.border,
      paddingHorizontal: ms(14),
      paddingTop: ms(16),
      paddingBottom: ms(12),
      ...asl.shadow.card},
    gifArea: {
      width: "100%",
      maxWidth: ms(240),
      aspectRatio: 1,
      alignSelf: "center",
      borderRadius: ms(18),
      overflow: "hidden",
      backgroundColor: "rgba(0,0,0,0.35)",
      marginBottom: ms(10)},
    gifImage: {
      width: "100%",
      height: "100%"},
    caption: {
      textAlign: "center",
      fontSize: ms(13),
      fontWeight: fontWeight.medium,
      color: "#000000"},
    signWord: {
      textAlign: "center",
      fontSize: ms(22),
      fontWeight: fontWeight.emphasis,
      color: "#000000",
      marginBottom: ms(6)},
    matchTitle: {
      fontSize: ms(16),
      fontWeight: fontWeight.emphasis,
      color: "#000000",
      textAlign: "center"},
    matchScore: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      color: "#000000",
      textAlign: "center",
      marginBottom: ms(10)},
    matchGrid: {
      flex: 1,
      gap: ms(8),
      minHeight: 0},
    matchRow: {
      flex: 1,
      flexDirection: "row",
      gap: ms(8)},
    gifTile: {
      aspectRatio: 1,
      borderRadius: ms(14),
      overflow: "hidden"},
    matchGifImage: {
      width: "100%",
      height: "100%"},
    wordTile: {
      flex: 1,
      borderRadius: ms(14),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(8),
      paddingVertical: ms(6)},
    wordTileText: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium,
      textAlign: "center",
      color: "#000000"},
    tileDisabled: {
      opacity: 0.92},
    feedbackRow: {
      height: ms(34),
      alignItems: "center",
      justifyContent: "center",
      marginTop: ms(8)},
    feedbackPill: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(6),
      borderRadius: ms(99)},
    feedbackCorrect: {
      backgroundColor: "rgba(74,222,128,0.15)",
      borderWidth: 1,
      borderColor: "rgba(74,222,128,0.35)"},
    feedbackWrong: {
      backgroundColor: "rgba(248,113,113,0.14)",
      borderWidth: 1,
      borderColor: "rgba(248,113,113,0.35)"},
    feedbackText: {
      fontSize: ms(12),
      fontWeight: fontWeight.medium},
    buttonRow: {
      paddingTop: ms(16),
      paddingBottom: ms(24),
      alignItems: "center",
      flexShrink: 0}});
