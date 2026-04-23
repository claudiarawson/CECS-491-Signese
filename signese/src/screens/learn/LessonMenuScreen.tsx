import { LESSON_DEFINITIONS } from "@/src/data/lessons";
import { LessonType } from "@/src/data/lessons/types";
import { lessonColors, lessonSpacing, lessonTypography, Radius } from "@/src/theme";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View, ScrollView } from "react-native";
import { scale, verticalScale } from "@/src/theme/responsive";
import { LessonNode } from "@/src/features/learn/ui/LessonNode";

export function LessonMenuScreen() {
  const handleOpenLesson = (lessonType: LessonType) => {
    router.push({
      pathname: "/learn/[lessonId]",
      params: { lessonId: lessonType, order: "1", score: "0" },
    } as any);
  };

  return (
    <ScreenContainer backgroundColor={lessonColors.background} contentPadded>
      <ScreenHeader title="Lessons" showBottomAccent={false} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.pathColumn}>
          {LESSON_DEFINITIONS.map((lesson, idx) => (
            <Pressable key={lesson.type} onPress={() => handleOpenLesson(lesson.type)}>
              <LessonNode
                title={lesson.title}
                active={idx === 0}
                completed={false}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: verticalScale(32),
  },
  pathColumn: {
    width: scale(120),
    alignItems: "center",
    justifyContent: "center",
  },
});
