import {
  LessonHeader,
  LessonResultCard,
  PrimaryActionButton,
} from "@/src/components/lesson-index";
import { LESSONS_BY_TYPE, LessonType } from "@/src/data/lessons";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { lessonColors, lessonSpacing, lessonTypography } from "@/src/theme";
import { calculateLessonStars } from "../../utils/lessonHelpers";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title="Lesson Complete" showBackButton={false} />
      <View style={styles.content}>
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

        <View style={styles.footer}>
          <PrimaryActionButton label="Continue" onPress={handleContinue} />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: lessonSpacing.lg,
  },
  bonusWrap: {
    marginTop: lessonSpacing.lg,
    rowGap: lessonSpacing.sm,
  },
  bonusText: {
    ...lessonTypography.body,
    color: lessonColors.textSecondary,
    textAlign: "center",
  },
  footer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: lessonSpacing.lg,
  },
});
