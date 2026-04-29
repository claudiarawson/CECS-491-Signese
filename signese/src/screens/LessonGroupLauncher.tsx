import { useLocalSearchParams, useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { NUMBER_GROUPS, ALPHABET_GROUPS } from "@/src/data/lessonGroups";

export default function LessonGroupLauncher() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const router = useRouter();
  const groups = category === "numbers" ? NUMBER_GROUPS : ALPHABET_GROUPS;
  const title = category === "numbers" ? "Number Lessons" : "Alphabet Lessons";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {groups.map((group) => (
        <TouchableOpacity
          key={group.id}
          style={styles.button}
          onPress={() => router.push({
            pathname: "/learn/[lessonId]",
            params: { lessonId: group.id, order: "1", score: "0" },
          })}
        >
          <Text style={styles.buttonText}>{group.title}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "white", marginBottom: 32 },
  button: { backgroundColor: "#6C3EF4", padding: 20, borderRadius: 16, marginBottom: 16 },
  buttonText: { color: "white", fontSize: 20, textAlign: "center", fontWeight: "600" },
});
