import React from "react";
import { ScrollView, StyleSheet, View, Text, Dimensions } from "react-native";
import Svg, { Path } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const centerX = width / 2;

const lessons = [
  { title: "Greetings", icon: "👋", top: 120, side: "right" },
  { title: "Numbers", icon: "🔢", top: 300, side: "left" },
  { title: "Colors", icon: "🎨", top: 480, side: "right" },
  { title: "Telling Time", icon: "⏰", top: 660, side: "left" },
  { title: "Food & Drink", icon: "🍔", top: 840, side: "right" },
  { title: "Common Objects", icon: "🏠", top: 1020, side: "left" },
];

export default function LearnScreen() {
  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={["#dbeafe", "#e9d5ff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.scene}
      >

        {/* ROAD */}
        <Svg height="1200" width={width} style={StyleSheet.absoluteFill}>
          <Path
            d={`
              M ${centerX} 0
              C ${centerX + 120} 150, ${centerX - 120} 250, ${centerX} 400
              C ${centerX + 120} 550, ${centerX - 120} 650, ${centerX} 800
              C ${centerX + 120} 950, ${centerX - 120} 1050, ${centerX} 1200
            `}
            stroke="#7ad3c2"
            strokeWidth="110"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>

        {/* LESSON BUBBLES */}
        {lessons.map((lesson) => (
          <View
            key={lesson.title}
            style={[
              styles.lesson,
              {
                top: lesson.top,
                left: lesson.side === "left" ? centerX - 180 : centerX + 50,
              },
            ]}
          >
            <Text style={styles.icon}>{lesson.icon}</Text>
            <Text style={styles.text}>{lesson.title}</Text>
          </View>
        ))}

      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  scene: {
    height: 1200,
  },

  lesson: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#d8dde3",

    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  icon: {
    fontSize: 36,
  },

  text: {
    marginTop: 6,
    fontWeight: "700",
    textAlign: "center",
    width: 90,
    lineHeight: 16,
  },
});