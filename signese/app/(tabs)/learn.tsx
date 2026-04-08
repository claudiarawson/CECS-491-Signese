import React, { useEffect, useMemo, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import {
  getUnlockedLessons,
  getCompletedLessons,
  LESSON_STAR_REQUIREMENTS,
  type LessonId,
} from "@/src/features/learn/utils/lessonProgress";

const BASE_WIDTH = 320;
const BASE_HEIGHT = 568;

const LESSON_NODES = [
  { id: "alphabet", title: "Alphabet", emoji: "🔤", x: 120, y: 80, route: "/learn/alphabet" },
  { id: "numbers", title: "Numbers", emoji: "🔢", x: 60, y: 190, route: "/learn/numbers" },
  { id: "greetings", title: "Greetings", emoji: "👋", x: 150, y: 300, route: "/learn/greetings" },
  { id: "family", title: "Family", emoji: "👨‍👩‍👧", x: 80, y: 410, route: "/learn/family" },
  { id: "colors", title: "Colors", emoji: "🎨", x: 145, y: 520, route: "/learn/colors" },
  { id: "telling-time", title: "Telling Time", emoji: "⏰", x: 70, y: 640, route: "/learn/telling-time" },
  { id: "food-drink", title: "Food & Drink", emoji: "🍔", x: 145, y: 760, route: "/learn/food-drink" },
] as const;

type LessonNode = (typeof LESSON_NODES)[number];

export default function LearnScreen() {
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const { width, height } = useWindowDimensions();

  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const [unlockedLessons, setUnlockedLessons] = useState<LessonId[]>([]);
  const [completedLessons, setCompletedLessons] = useState<LessonId[]>([]);

  const loadProgress = async () => {
    try {
      const unlocked = await getUnlockedLessons();
      const completed = await getCompletedLessons();
      setUnlockedLessons(unlocked);
      setCompletedLessons(completed);
    } catch (error) {
      console.warn("Failed to load lesson progress", error);
    }
  };

  useEffect(() => {
    void loadProgress();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void loadProgress();
    }, [])
  );

  const frameWidth = Math.min(width, 480);
  const frameHeight = Math.max(height, BASE_HEIGHT);

  const scale = (size: number) => (frameWidth / BASE_WIDTH) * size;
  const vscale = (size: number) => (frameHeight / BASE_HEIGHT) * size;
  const tscale = (size: number) => scale(size) * textScale;

  const canvasHeight = vscale(980);
  const navSafePad = Math.max(vscale(92), 100);

  const snakePath = [
    `M${scale(160)} ${vscale(0)}`,
    `C${scale(300)} ${vscale(80)}, ${scale(40)} ${vscale(160)}, ${scale(160)} ${vscale(240)}`,
    `C${scale(300)} ${vscale(320)}, ${scale(40)} ${vscale(400)}, ${scale(160)} ${vscale(480)}`,
    `C${scale(300)} ${vscale(560)}, ${scale(40)} ${vscale(640)}, ${scale(160)} ${vscale(720)}`,
    `C${scale(300)} ${vscale(800)}, ${scale(40)} ${vscale(880)}, ${scale(160)} ${vscale(960)}`,
  ].join(" ");

  const currentLessonIndex = LESSON_NODES.findIndex(
    (lesson) => !unlockedLessons.includes(lesson.id as LessonId)
  );

  const handleLessonPress = (lesson: LessonNode) => {
    const isUnlocked = unlockedLessons.includes(lesson.id as LessonId);

    if (!isUnlocked) {
      const starsRequired = LESSON_STAR_REQUIREMENTS[lesson.id as LessonId];
      Alert.alert(
        "Lesson Locked",
        `${lesson.title} requires ${starsRequired} stars to unlock.`
      );
      return;
    }

    router.push(lesson.route as any);
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
            <HeaderAvatarButton
              avatar={headerProfileIcon.emoji}
              onPress={() => router.push("/(tabs)/account" as any)}
            />
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
              const nodeIndex = LESSON_NODES.findIndex((item) => item.id === lesson.id);
              const isUnlocked = unlockedLessons.includes(lesson.id as LessonId);
              const isCompleted = completedLessons.includes(lesson.id as LessonId);
              const isCurrent =
                currentLessonIndex !== -1 && nodeIndex === currentLessonIndex;
              const isLocked = !isUnlocked;
              const starsRequired = LESSON_STAR_REQUIREMENTS[lesson.id as LessonId];

              return (
                <Pressable
                  key={lesson.id}
                  onPress={() => handleLessonPress(lesson)}
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
                    <View style={[styles.badgeRow, { top: scale(8), right: scale(8) }]}>
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
                          fontSize: tscale(16),
                          lineHeight: tscale(18),
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
                          fontSize: tscale(11),
                          lineHeight: tscale(13),
                          color: isLocked ? "#64748B" : "#334155",
                        },
                      ]}
                    >
                      {lesson.title}
                    </Text>

                    {isLocked ? (
                      <Text
                        style={[
                          styles.starsNeededText,
                          {
                            marginTop: vscale(4),
                            fontSize: tscale(9),
                            lineHeight: tscale(11),
                          },
                        ]}
                      >
                        ⭐ {starsRequired}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
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
      shadowRadius: ms(10),
      shadowOffset: { width: 0, height: ms(5) },
      elevation: 6,
    },
    lessonInner: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      paddingHorizontal: ms(2),
    },
    badgeRow: {
      position: "absolute",
      zIndex: 2,
    },
    emoji: {
      color: "#334155",
      textAlign: "center",
    },
    label: {
      fontWeight: "700",
      textAlign: "center",
      paddingHorizontal: ms(4),
    },
    starsNeededText: {
      color: "#64748B",
      fontWeight: "700",
      textAlign: "center",
    },
  });
};