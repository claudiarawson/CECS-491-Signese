import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  ScreenContainer,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import {
  GREETINGS_LEARN_ITEMS,
  GREETINGS_BATCH_1,
  GREETINGS_BATCH_2,
  type GreetingLearnItem,
} from "@/src/features/learn/data/greetings";

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
    state: "default",
  }));
  const wordTiles: MatchTile[] = shuffleArray(
    batch.map((s) => ({ id: s.id, label: s.label, image: s.image, state: "default" as TileState }))
  );
  return { gifTiles, wordTiles };
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function GreetingsLearnScreen() {
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

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
        pathname: "/learn/greetings/complete" as any,
        params: { totalCorrect: String(totalCorrect) },
      });
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
        state: t.state === "correct" ? "correct" : t.id === id ? "selected" : "default",
      }))
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
        state: t.state === "correct" ? "correct" : t.id === id ? "selected" : "default",
      }))
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
    if (state === "selected") return { borderColor: "#4DB3A8", backgroundColor: "#E1F5EE" };
    if (state === "correct") return { borderColor: "#4DB3A8", backgroundColor: "#E1F5EE" };
    if (state === "wrong") return { borderColor: "#E24B4A", backgroundColor: "#FCEBEB" };
    return { borderColor: "#E2EDF3", backgroundColor: "#EEF7FA" };
  };

  const wordTileStyle = (state: TileState) => {
    if (state === "selected") return { borderColor: "#7DD3FC", backgroundColor: "#EBF4F8" };
    if (state === "correct") return { borderColor: "#4DB3A8", backgroundColor: "#E1F5EE" };
    if (state === "wrong") return { borderColor: "#E24B4A", backgroundColor: "#FCEBEB" };
    return { borderColor: "#E2EDF3", backgroundColor: "#EEF7FA" };
  };

  const wordTileTextColor = (state: TileState) => {
    if (state === "correct") return "#0F6E56";
    if (state === "wrong") return "#A32D2D";
    return "#334155";
  };

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <ScreenContainer backgroundColor="#CDDDED">
      {/* Top bar */}
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (step === 1 ? router.back() : setStep((s) => s - 1))}
        >
          <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Greetings</Text>

        <View style={styles.headerRight}>
          <HeaderActionButton
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings" as any)}
          />
          <HeaderAvatarButton
            avatar={headerProfileIcon.emoji}
            onPress={() => router.push("/(tabs)/account" as any)}
          />
        </View>
      </View>

      {/* Progress strip */}
      <View style={styles.progressStrip}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>{progressLabel}</Text>
          <Text style={styles.progressLabel}>{step}/{TOTAL_STEPS}</Text>
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
        <Pressable
          style={[styles.nextButton, !nextEnabled && styles.nextButtonDisabled]}
          onPress={nextEnabled ? handleNext : undefined}
        >
          <Text style={styles.nextButtonText}>
            {step === 9 ? "Finish" : "Next"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

// ─── Learn card sub-component ────────────────────────────────────────────────
function LearnCard({
  item,
  styles,
}: {
  item: { image: any; label: string };
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.gifArea}>
        <Image source={item.image} style={styles.gifImage} resizeMode="cover" />
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
  gifTileStyle,
  wordTileStyle,
  wordTileTextColor,
  totalCorrect,
  styles,
}: {
  gifTiles: MatchTile[];
  wordTiles: MatchTile[];
  onGifTap: (id: string) => void;
  onWordTap: (id: string) => void;
  feedbackMsg: string | null;
  feedbackCorrect: boolean;
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
        {/* GIF column */}
        <View style={styles.matchCol}>
          {gifTiles.map((tile) => (
            <Pressable
              key={tile.id}
              style={[
                styles.gifTile,
                gifTileStyle(tile.state),
                { borderWidth: 2 },
                tile.state === "correct" && styles.tileDisabled,
              ]}
              onPress={() => onGifTap(tile.id)}
              disabled={tile.state === "correct"}
            >
              <Image source={tile.image} style={styles.matchGifImage} resizeMode="cover" />
            </Pressable>
          ))}
        </View>

        {/* Word column */}
        <View style={styles.matchCol}>
          {wordTiles.map((tile) => (
            <Pressable
              key={tile.id}
              style={[
                styles.wordTile,
                wordTileStyle(tile.state),
                { borderWidth: 2 },
                tile.state === "correct" && styles.tileDisabled,
              ]}
              onPress={() => onWordTap(tile.id)}
              disabled={tile.state === "correct"}
            >
              <Text
                style={[
                  styles.wordTileText,
                  { color: wordTileTextColor(tile.state) },
                ]}
                numberOfLines={2}
              >
                {tile.label}
              </Text>
            </Pressable>
          ))}
        </View>
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
                { color: feedbackCorrect ? "#0F6E56" : "#A32D2D" },
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

// ─── Styles ──────────────────────────────────────────────────────────────────
const createStyles = (density: number, textScale: number) => {
  const ms = (v: number) => moderateScale(v) * density;
  const ts = (v: number) => ms(v) * textScale;

  return StyleSheet.create({
    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: ms(16),
      paddingVertical: ms(10),
      gap: ms(12),
    },
    backButton: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: "#4DB3A8",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: ts(18),
      fontWeight: "800",
      color: "#334155",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(6),
    },
    // Progress strip
    progressStrip: {
      backgroundColor: "#CDDDED",
      paddingHorizontal: ms(16),
      paddingTop: ms(6),
    },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: ms(4),
    },
    progressLabel: {
      fontSize: ts(12),
      fontWeight: "700",
      color: "#334155",
    },
    progressTrack: {
      height: ms(10),
      borderRadius: ms(99),
      backgroundColor: "#F5A898",
      overflow: "hidden",
      marginBottom: ms(24),
    },
    progressFill: {
      height: "100%",
      borderRadius: ms(99),
      backgroundColor: "#4DB3A8",
    },
    // Card wrapper (fills between progress and button)
    cardWrapper: {
      flex: 1,
      backgroundColor: "#CDDDED",
    },
    // White card
    card: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      borderTopLeftRadius: ms(24),
      borderTopRightRadius: ms(24),
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      paddingHorizontal: ms(16),
      paddingTop: ms(12),
      paddingBottom: ms(16),
      gap: ms(8),
    },
    // Learn card
    gifArea: {
      flex: 1,
      minHeight: 0,
      borderRadius: ms(16),
      overflow: "hidden",
      backgroundColor: "#EEF7FA",
    },
    gifImage: {
      width: "100%",
      height: "100%",
    },
    caption: {
      textAlign: "center",
      fontSize: ts(13),
      fontWeight: "600",
      color: "#94A3B8",
    },
    signWord: {
      textAlign: "center",
      fontSize: ts(22),
      fontWeight: "800",
      color: "#334155",
    },
    // Match card
    matchTitle: {
      fontSize: ts(16),
      fontWeight: "800",
      color: "#334155",
      textAlign: "center",
    },
    matchScore: {
      fontSize: ts(12),
      fontWeight: "600",
      color: "#94A3B8",
      textAlign: "center",
    },
    matchGrid: {
      flex: 1,
      flexDirection: "row",
      gap: ms(8),
      minHeight: 0,
    },
    matchCol: {
      flex: 1,
      gap: ms(8),
    },
    gifTile: {
      flex: 1,
      borderRadius: ms(14),
      overflow: "hidden",
      minHeight: ms(60),
    },
    matchGifImage: {
      width: "100%",
      height: "100%",
    },
    wordTile: {
      flex: 1,
      borderRadius: ms(14),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(6),
      paddingVertical: ms(6),
      minHeight: ms(60),
    },
    wordTileText: {
      fontSize: ts(12),
      fontWeight: "700",
      textAlign: "center",
    },
    tileDisabled: {
      opacity: 0.9,
    },
    // Feedback
    feedbackRow: {
      minHeight: ms(28),
      alignItems: "center",
      justifyContent: "center",
    },
    feedbackPill: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(4),
      borderRadius: ms(99),
    },
    feedbackCorrect: {
      backgroundColor: "#E1F5EE",
    },
    feedbackWrong: {
      backgroundColor: "#FCEBEB",
    },
    feedbackText: {
      fontSize: ts(12),
      fontWeight: "700",
    },
    // Next button
    buttonRow: {
      backgroundColor: "#CDDDED",
      paddingTop: ms(26),
      paddingHorizontal: ms(16),
      paddingBottom: ms(16),
    },
    nextButton: {
      height: ms(56),
      borderRadius: ms(24),
      backgroundColor: "#4DB3A8",
      alignItems: "center",
      justifyContent: "center",
    },
    nextButtonDisabled: {
      backgroundColor: "#B0D4D1",
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontSize: ts(17),
      fontWeight: "700",
    },
  });
};
