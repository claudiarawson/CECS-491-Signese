import React from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { router } from "expo-router";
import { ScreenContainer, ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 568;

const LESSON_NODES = [
  { id: 1, title: "Greetings", emoji: "👋", x: 120, y: 80 },
  { id: 2, title: "Numbers", emoji: "🔢", x: 60, y: 190 },
  { id: 3, title: "Family", emoji: "👨‍👩‍👧", x: 150, y: 300 },
  { id: 4, title: "Colors", emoji: "🎨", x: 80, y: 410 },
  { id: 5, title: "Telling Time", emoji: "⏰", x: 145, y: 520 },
  { id: 6, title: "Food & Drink", emoji: "🍔", x: 70, y: 640 },
  { id: 7, title: "Daily Phrases", emoji: "🗣️", x: 145, y: 760 },
];

export default function LearnScreen() {
  const { width, height } = useWindowDimensions();

  const frameWidth = Math.min(width, 480);
  const frameHeight = Math.max(height, BASE_HEIGHT);

  const scale = (size: number) => (frameWidth / BASE_WIDTH) * size;
  const vscale = (size: number) => (frameHeight / BASE_HEIGHT) * size;

  const canvasHeight = vscale(980);
  const navSafePad = Math.max(vscale(92), 100);

  const snakePath = [
    `M${scale(160)} ${vscale(0)}`,
    `C${scale(300)} ${vscale(80)}, ${scale(40)} ${vscale(160)}, ${scale(160)} ${vscale(240)}`,
    `C${scale(300)} ${vscale(320)}, ${scale(40)} ${vscale(400)}, ${scale(160)} ${vscale(480)}`,
    `C${scale(300)} ${vscale(560)}, ${scale(40)} ${vscale(640)}, ${scale(160)} ${vscale(720)}`,
    `C${scale(300)} ${vscale(800)}, ${scale(40)} ${vscale(880)}, ${scale(160)} ${vscale(960)}`,
  ].join(" ");

  return (
    <ScreenContainer backgroundColor="#F4F4F6">
      <ScreenHeader
        title="Lessons"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings")}
            />
            <HeaderAvatarButton avatar="🐨" onPress={() => router.push("/(tabs)/account")} />
          </>
        }
      />

      <View style={styles.content}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="learnBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#C9D1D7" />
              <Stop offset="100%" stopColor="#D9D2E6" />
            </LinearGradient>
          </Defs>
          <Path d={`M0 0 H${width} V${height} H0 Z`} fill="url(#learnBg)" />
        </Svg>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: navSafePad }]}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <View style={[styles.mapFrame, { width: frameWidth, height: canvasHeight }]}>
            <Svg height={canvasHeight} width={frameWidth} style={styles.road}>
              <Path
                d={snakePath}
                stroke="#7DD3FC"
                strokeOpacity={0.5}
                strokeWidth={scale(56)}
                fill="none"
                strokeLinecap="round"
              />
              <Path
                d={snakePath}
                stroke="#65D8C5"
                strokeWidth={scale(34)}
                fill="none"
                strokeLinecap="round"
              />
            </Svg>

            {LESSON_NODES.map((lesson) => (
              <View
                key={lesson.id}
                style={[
                  styles.lesson,
                  {
                    top: vscale(lesson.y),
                    left: scale(lesson.x),
                    width: scale(92),
                    height: scale(92),
                    borderRadius: scale(46),
                    borderWidth: scale(5),
                  },
                ]}
              >
                <View style={[styles.lessonInner, { borderRadius: scale(40), borderWidth: scale(3) }]}>
                  <Text style={[styles.emoji, { fontSize: scale(16) }]}>{lesson.emoji}</Text>
                  <Text style={[styles.label, { marginTop: vscale(4), fontSize: scale(11) }]}>
                    {lesson.title}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
  },
  mapFrame: {
    position: "relative",
  },
  road: {
    position: "absolute",
  },
  lesson: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    borderColor: "#BEEDEA",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#83C5BE",
    shadowOpacity: 0.32,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  lessonInner: {
    width: "100%",
    height: "100%",
    borderColor: "#E5F6F4",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    color: "#334155",
  },
  label: {
    color: "#334155",
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});
