import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import Svg, { Path, Circle, Rect } from "react-native-svg";

const { width } = Dimensions.get("window");
const centerX = width / 2;

const lessons = [
  { emoji: "👋", title: "Greetings", top: 120, side: "right" },
  { emoji: "🔢", title: "Numbers", top: 280, side: "left" },
  { emoji: "🎨", title: "Colors", top: 440, side: "right" },
  { emoji: "⏰", title: "Telling Time", top: 600, side: "left" },
  { emoji: "🍔", title: "Food & Drink", top: 760, side: "right" },
  { emoji: "🏠", title: "Common Objects", top: 920, side: "left" },
];

const Tree = ({ x, y }: { x: number; y: number }) => (
  <Svg
    style={{ position: "absolute", left: x, top: y }}
    width="70"
    height="90"
    viewBox="0 0 70 90"
  >
    {/* leaves */}
    <Circle cx="35" cy="30" r="20" fill="#9ED9C5" />
    <Circle cx="20" cy="35" r="16" fill="#7ED6C5" />
    <Circle cx="50" cy="35" r="16" fill="#7ED6C5" />

    {/* trunk */}
    <Rect x="30" y="50" width="10" height="30" fill="#8B5E3C" />
  </Svg>
);

export default function Learn() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.mapContainer}>

        {/* Decorative Trees */}
        <Tree x={30} y={200} />
        <Tree x={width - 100} y={450} />
        <Tree x={20} y={700} />
        <Tree x={width - 90} y={900} />

        {/* Clouds */}
        <Text style={[styles.cloud, { top: 80, left: 40 }]}>☁️</Text>
        <Text style={[styles.cloud, { top: 400, right: 40 }]}>☁️</Text>
        <Text style={[styles.cloud, { top: 700, left: 60 }]}>☁️</Text>

        {/* Road */}
        <Svg height="1100" width="100%" style={StyleSheet.absoluteFill}>
          <Path
            d={`
              M ${centerX} 80
              C ${centerX + 120} 200 ${centerX - 120} 260 ${centerX} 400
              C ${centerX + 120} 540 ${centerX - 120} 620 ${centerX} 760
              C ${centerX + 120} 900 ${centerX - 120} 980 ${centerX} 1120
            `}
            stroke="#7ED6C5"
            strokeWidth="70"
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
              {
                top: lesson.top,
                left:
                  lesson.side === "left"
                    ? centerX - 140
                    : centerX + 30,
              },
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
    height: 1100,
    position: "relative",
  },

  lessonBubble: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#DCE4EA",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  emoji: {
    fontSize: 30,
  },

  lessonText: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
    color: "#333",
    textAlign: "center",
  },

  cloud: {
    position: "absolute",
    fontSize: 28,
    opacity: 0.5,
  },
});