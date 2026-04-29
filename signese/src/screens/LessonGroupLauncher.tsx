import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { NUMBER_GROUPS, ALPHABET_GROUPS } from "@/src/data/lessonGroups";
import { GradientBackground } from "@/src/components/asl";
import { useTheme, type ThemeColors } from "@/src/contexts/ThemeContext";

export default function LessonGroupLauncher() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const groups = category === "numbers" ? NUMBER_GROUPS : ALPHABET_GROUPS;
  const title = category === "numbers" ? "Number Lessons" : "Alphabet Lessons";

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {groups.map((group) => (
          <TouchableOpacity
            key={group.id}
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: "/learn/[lessonId]",
                params: { lessonId: group.id, order: "1", score: "0" },
              })
            }
          >
            <Text style={styles.buttonText}>{group.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </GradientBackground>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 24, paddingTop: 60 },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 32,
    },
    button: {
      backgroundColor: colors.primary,
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: 20,
      textAlign: "center",
      fontWeight: "600",
    },
  });
