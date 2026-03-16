import { View, Text, StyleSheet, ScrollView } from "react-native";
import Svg, { Path } from "react-native-svg";

const lessons = [
  { emoji: "👋", title: "Greetings", top: 80, left: 160 },
  { emoji: "🔢", title: "Numbers", top: 240, left: 100 },
  { emoji: "👨‍👩‍👧", title: "Family", top: 400, left: 170 },
  { emoji: "🎨", title: "Colors", top: 560, left: 110 },
];

export default function Learn() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>

        {/* Background decorations */}
        <Text style={[styles.cloud, { top: 60, left: 40 }]}>☁️</Text>
        <Text style={[styles.cloud, { top: 320, right: 40 }]}>☁️</Text>

        <Text style={[styles.tree, { top: 260, left: 40 }]}>🌳</Text>
        <Text style={[styles.tree, { top: 500, right: 40 }]}>🌳</Text>

        {/* Road Path */}
        <Svg height="750" width="100%" style={StyleSheet.absoluteFill}>
          <Path
            d="
              M200 50
              C100 150 100 200 200 300
              C300 400 100 450 200 550
              C300 650 120 700 200 780
            "
            stroke="#7ED6C5"
            strokeWidth="40"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>

        {/* Lessons */}
        {lessons.map((lesson, index) => (
          <View
            key={index}
            style={[
              styles.lessonBubble,
              { top: lesson.top, left: lesson.left },
            ]}
          >
            <Text style={styles.emoji}>{lesson.emoji}</Text>
            <Text style={styles.lessonText}>{lesson.title}</Text>
          </View>
        ))}

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EEF1F4",
  },

  mapContainer: {
    height: 800,
    position: "relative",
  },

  lessonBubble: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "#DDE6EC",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  emoji: {
    fontSize: 28,
  },

  lessonText: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
    color: "#333",
  },

  cloud: {
    position: "absolute",
    fontSize: 30,
    opacity: 0.6,
  },

  tree: {
    position: "absolute",
    fontSize: 28,
  },
});