import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  Pressable,
  Alert,
} from "react-native";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
} from "@/src/components/layout";
import { addStarsToCurrentUser } from "@/src/features/gamification/stars.services";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 568;
const CURRENT_LESSON_ID = 3;

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
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
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

  const handleLessonPress = (lessonId: number, lessonTitle: string) => {
    if (lessonId > CURRENT_LESSON_ID) {
      Alert.alert(
        "Lesson Locked",
        `${lessonTitle} is a future lesson. Please complete the earlier lessons first.`
      );
      return;
    }

    router.push({
      pathname: "/learn/[id]",
      params: { id: String(lessonId) },
    } as any);
  };

  const handleCompleteLesson = async (lessonTitle: string) => {
    try {
      const reward = 5;
      const updated = await addStarsToCurrentUser(reward);

      Alert.alert(
        "Lesson Complete",
        `${lessonTitle} completed! You earned ${reward} stars.\n\nCurrent stars: ${updated.balance}`
      );
    } catch (error) {
      console.warn("Failed to award stars", error);
      Alert.alert("Error", "Could not award stars.");
    }
  };

  return (
    <ScreenContainer backgroundColor="#F4F4F6">
      <ScreenHeader
        title="Lessons"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings" as any)}
            />

            <Pressable
              style={styles.headerProfileButton}
              onPress={() => router.push("/(tabs)/account" as any)}
            >
              <Text style={styles.headerProfileEmoji}>
                {headerProfileIcon.emoji}
              </Text>
            </Pressable>
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
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: navSafePad },
          ]}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <View
            style={[styles.mapFrame, { width: frameWidth, height: canvasHeight }]}
          >
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

            {LESSON_NODES.map((lesson) => {
              const isCompleted = lesson.id < CURRENT_LESSON_ID;
              const isCurrent = lesson.id === CURRENT_LESSON_ID;
              const isLocked = lesson.id > CURRENT_LESSON_ID;

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => handleLessonPress(lesson.id, lesson.title)}
                  style={({ pressed }) => [
                    styles.lesson,
                    {
                      top: vscale(lesson.y),
                      left: scale(lesson.x),
                      width: scale(92),
                      height: scale(92),
                      borderRadius: scale(46),
                      borderWidth: scale(5),
                      opacity: pressed ? 0.88 : 1,
                      backgroundColor: isLocked ? "#EEF2F7" : "#FFFFFF",
                      borderColor: isCurrent
                        ? "#65D8C5"
                        : isCompleted
                          ? "#BEEDEA"
                          : "#D7DEE8",
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.lessonInner,
                      {
                        borderRadius: scale(40),
                        borderWidth: scale(3),
                        borderColor: isLocked ? "#D9E2EC" : "#E5F6F4",
                      },
                    ]}
                  >
                    <View style={styles.badgeRow}>
                      {isCompleted ? (
                        <MaterialIcons
                          name="check-circle"
                          size={scale(18)}
                          color="#22C55E"
                        />
                      ) : null}

                      {isLocked ? (
                        <MaterialIcons
                          name="lock"
                          size={scale(18)}
                          color="#64748B"
                        />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.emoji,
                        {
                          fontSize: scale(16),
                          opacity: isLocked ? 0.55 : 1,
                        },
                      ]}
                    >
                      {lesson.emoji}
                    </Text>

                    <Text
                      style={[
                        styles.label,
                        {
                          marginTop: vscale(4),
                          fontSize: scale(11),
                          color: isLocked ? "#64748B" : "#334155",
                        },
                      ]}
                    >
                      {lesson.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={styles.testButton}
            onPress={() => void handleCompleteLesson("Greetings")}
          >
            <Text style={styles.testButtonText}>
              Complete Test Lesson (+5 stars)
            </Text>
          </Pressable>
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
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badgeRow: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
  },
  emoji: {
    color: "#334155",
  },
  label: {
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
  testButton: {
    marginTop: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: "#43B3A8",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  headerProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E6DDF0",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  headerProfileEmoji: {
    fontSize: 18,
  },
});