import { LESSON_DEFINITIONS } from "@/src/data/lessons";
import { LessonType } from "@/src/data/lessons/types";
import { AppShell, LearnFlowHeader } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";
import { router } from "expo-router";
import React from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LessonNode } from "@/src/features/learn/ui/LessonNode";
import { Spacing } from "@/src/theme";

export function LessonMenuScreen() {
  const handleOpenLesson = (lessonType: LessonType) => {
    router.push({
      pathname: "/learn/[lessonId]",
      params: { lessonId: lessonType, order: "1", score: "0" },
    } as any);
  };

  const headerRight = (
    <>
      <Pressable
        onPress={() => router.push("/(tabs)/settings" as any)}
        hitSlop={8}
        accessibilityLabel="Open settings"
        style={styles.headerIcon}
      >
        <MaterialIcons name="settings" size={24} color={asl.text.secondary} />
      </Pressable>
      <Pressable
        onPress={() => router.push("/(tabs)/account")}
        hitSlop={8}
        accessibilityLabel="Open profile"
        style={styles.headerIcon}
      >
        <MaterialIcons name="account-circle" size={26} color={asl.text.secondary} />
      </Pressable>
    </>
  );

  return (
    <AppShell
      variant="default"
      header={
        <LearnFlowHeader title="Lesson path" onBackPress={() => router.push("/(tabs)/learn")} rightExtra={headerRight} />
      }
    >
      <Text style={styles.lead}>Follow the path · tap a node to practice.</Text>
      <View style={styles.pathColumn}>
        {LESSON_DEFINITIONS.map((lesson, idx) => (
          <Pressable key={lesson.type} onPress={() => handleOpenLesson(lesson.type)}>
            <LessonNode title={lesson.title} active={idx === 0} completed={false} />
          </Pressable>
        ))}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  lead: {
    color: asl.text.muted,
    fontSize: 14,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  pathColumn: {
    width: "100%",
    maxWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  headerIcon: { padding: 4 },
});
