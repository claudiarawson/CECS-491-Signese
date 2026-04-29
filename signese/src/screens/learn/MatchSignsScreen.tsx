import {
  LessonHeader,
  LessonProgressBar,
  MatchingPairCard,
  PrimaryActionButton,
} from "@/src/components/lesson-index";
import { LessonType } from "@/src/data/lessons";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { lessonSpacing, Spacing } from "@/src/theme";
import { lessonColors } from "@/src/theme/colors";
import { calculateProgress, getLessonSigns } from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

type PairMap = Record<string, string>;

function shuffle<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function MatchSignsScreen() {
  const params = useLocalSearchParams<{ lessonId?: string; score?: string }>();
  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const score = Number(params.score ?? "0");

  const signs = getLessonSigns(lessonId);
  const progress = calculateProgress(lessonId, Math.max(1, signs.length), "match");

  const shuffledLabels = useMemo(() => shuffle(signs.map((sign) => sign.label)), [signs]);

  const [selectedSignId, setSelectedSignId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [pairs, setPairs] = useState<PairMap>({});

  const pairedLabels = new Set(Object.values(pairs));

  const applyPairIfReady = (nextSignId: string | null, nextLabel: string | null) => {
    if (!nextSignId || !nextLabel) {
      return;
    }

    setPairs((prev) => ({ ...prev, [nextSignId]: nextLabel }));
    setSelectedSignId(null);
    setSelectedLabel(null);
  };

  const onSignPress = (signId: string) => {
    if (pairs[signId]) {
      return;
    }
    const nextSignId = selectedSignId === signId ? null : signId;
    setSelectedSignId(nextSignId);
    applyPairIfReady(nextSignId, selectedLabel);
  };

  const onLabelPress = (label: string) => {
    if (pairedLabels.has(label)) {
      return;
    }
    const nextLabel = selectedLabel === label ? null : label;
    setSelectedLabel(nextLabel);
    applyPairIfReady(selectedSignId, nextLabel);
  };

  const complete = signs.length > 0 && Object.keys(pairs).length === signs.length;
  const allCorrect = complete && signs.every((sign) => pairs[sign.id] === sign.label);

  const handleFinish = () => {
    const updatedScore = score + (allCorrect ? signs.length : 0);
    router.push({
      pathname: "/learn/lesson-complete",
      params: {
        lessonId,
        score: String(updatedScore),
        completed: String(allCorrect),
      },
    } as any);
  };

  return (
    <AppShell scroll={false} header={<LearnFlowHeader title="Matching review" />}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <LessonHeader title="Match signs to labels" subtitle="Tap one sign then one label." />
          <LessonProgressBar currentStep={progress.currentStep} totalSteps={progress.totalSteps} />

          <View style={styles.columns}>
            <View style={styles.column}>
              {signs.map((sign) => {
                const matched = Boolean(pairs[sign.id]);
                return (
                  <MatchingPairCard
                    key={sign.id}
                    label={`Sign ${sign.order}`}
                    isSelected={selectedSignId === sign.id}
                    isMatched={matched}
                    onPress={() => onSignPress(sign.id)}
                  />
                );
              })}
            </View>

            <View style={styles.column}>
              {shuffledLabels.map((label) => (
                <MatchingPairCard
                  key={label}
                  label={label}
                  isSelected={selectedLabel === label}
                  isMatched={pairedLabels.has(label)}
                  onPress={() => onLabelPress(label)}
                />
              ))}
            </View>
          </View>

          {complete ? (
            <Text style={[styles.feedback, allCorrect ? styles.correct : styles.incorrect]}>
              {allCorrect ? "Great matching" : "Some pairs are incorrect. You can still finish."}
            </Text>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton label="Finish lesson" onPress={handleFinish} disabled={!complete} />
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.screenPadding,
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: lessonSpacing.sm,
  },
  columns: {
    flexDirection: "row",
    columnGap: lessonSpacing.sm,
    marginTop: lessonSpacing.md,
  },
  column: {
    flex: 1,
    rowGap: lessonSpacing.sm,
  },
  feedback: {
    textAlign: "center",
    marginTop: lessonSpacing.md,
    fontSize: 16,
    lineHeight: 22,
    color: lessonColors.textSecondary,
  },
  correct: {
    color: lessonColors.success,
  },
  incorrect: {
    color: lessonColors.error,
  },
  footer: {
    flexShrink: 0,
    alignItems: "center",
    paddingBottom: lessonSpacing.lg,
    paddingTop: lessonSpacing.sm,
  },
});
