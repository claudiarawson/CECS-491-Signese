import {
  LessonHeader,
  LessonResultCard,
  PrimaryActionButton,
} from "@/src/components/lesson-index";
import { LESSONS_BY_TYPE, LessonType } from "@/src/data/lessons";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { lessonSpacing, Spacing } from "@/src/theme";
import { lessonColors } from "@/src/theme/colors";
import { calculateLessonStars } from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

export function LessonCompleteScreen() {
  const params = useLocalSearchParams<{
    lessonId?: string;
    score?: string;
    completed?: string;
  }>();

  const lessonId = (params.lessonId ?? "greetings") as LessonType;
  const score = Number(params.score ?? "0");
  const completed = String(params.completed ?? "true") === "true";
  const [usedBonus, setUsedBonus] = useState(false);

  const lesson = LESSONS_BY_TYPE[lessonId];

  const stars = useMemo(
    () => calculateLessonStars(completed, usedBonus),
    [completed, usedBonus]
  );

  const handleTranslateBonus = () => {
    setUsedBonus(true);
    router.push("/(tabs)/translate" as any);
  };

  const handleContinue = () => {
    router.push("/(tabs)/learn" as any);
  };

  return (
    <AppShell scroll={false} header={<LearnFlowHeader title="Lesson complete" showBack={false} />}>
      <View style={styles.shell}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <LessonHeader title="Great work" subtitle={`${lesson.title} finished`} />

          <LessonResultCard
            title="Stars earned"
            subtitle={`Score: ${score} • Base stars: 4 • Bonus: ${usedBonus ? "+1" : "0"}`}
            stars={stars}
          />

          <View style={styles.bonusWrap}>
            <Text style={styles.bonusText}>
              Bonus star: Go to Translate and test your own signing.
            </Text>
            <PrimaryActionButton
              label={usedBonus ? "Bonus unlocked" : "Go to Translate"}
              onPress={handleTranslateBonus}
              disabled={usedBonus}
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryActionButton label="Continue" onPress={handleContinue} />
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
    paddingTop: lessonSpacing.sm,
    paddingBottom: lessonSpacing.sm,
    flexGrow: 1,
  },
  bonusWrap: {
    marginTop: lessonSpacing.lg,
    rowGap: lessonSpacing.sm,
  },
  bonusText: {
    fontSize: 16,
    lineHeight: 22,
    color: lessonColors.textSecondary,
    textAlign: "center",
  },
  footer: {
    flexShrink: 0,
    alignItems: "center",
    paddingBottom: lessonSpacing.lg,
    paddingTop: lessonSpacing.sm,
  },
});
