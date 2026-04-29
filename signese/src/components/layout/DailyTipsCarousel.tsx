import React, { useState, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  Animated,
  PanResponder,
} from "react-native";
import { Spacing, moderateScale, fontFamily } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

export type DailyTip = {
  id: string;
  emoji: string;
  title: string;
  description: string;
};

const DEFAULT_TIPS: DailyTip[] = [
  {
    id: "1",
    emoji: "😊",
    title: "Tip: Facial Expressions",
    description: "In ASL, facial expressions are just as important as hand movements!",
  },
  {
    id: "2",
    emoji: "✋",
    title: "Tip: Hand Shape",
    description: "Make sure your fingers are clearly separated when signing letters like A, S, and T.",
  },
  {
    id: "3",
    emoji: "👀",
    title: "Tip: Eye Contact",
    description: "Maintain eye contact while signing to show attention and improve comprehension.",
  },
  {
    id: "4",
    emoji: "🔄",
    title: "Tip: Practice Daily",
    description: "Even 10 minutes of daily practice can significantly improve your ASL skills.",
  },
  {
    id: "5",
    emoji: "🤝",
    title: "Tip: Body Language",
    description: "Use your body and shoulders to emphasize signs for a more natural flow.",
  },
];

type DailyTipsCarouselProps = {
  tips?: DailyTip[];
};

export function DailyTipsCarousel({ tips = DEFAULT_TIPS }: DailyTipsCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const contentOpacity = useRef(new Animated.Value(1)).current;

  const cardWidth = width - Spacing.screenPadding * 2;

  const goToSlide = useCallback(
    (newIndex: number) => {
      if (isTransitioning || newIndex < 0 || newIndex >= tips.length || newIndex === activeIndex) {
        return;
      }

      setIsTransitioning(true);
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 110,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) {
          setIsTransitioning(false);
          return;
        }

        setActiveIndex(newIndex);

        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 110,
          useNativeDriver: true,
        }).start(() => {
          setIsTransitioning(false);
        });
      });
    },
    [activeIndex, tips.length, contentOpacity, isTransitioning]
  );

  const handleNext = () => goToSlide(activeIndex + 1);
  const handlePrev = () => goToSlide(activeIndex - 1);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const horizontalMove = Math.abs(gestureState.dx) > 12;
          const mostlyHorizontal = Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
          return horizontalMove && mostlyHorizontal;
        },
        onPanResponderRelease: (_, gestureState) => {
          if (isTransitioning) {
            return;
          }

          const SWIPE_THRESHOLD = 40;

          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            handleNext();
            return;
          }

          if (gestureState.dx >= SWIPE_THRESHOLD) {
            handlePrev();
          }
        },
      }),
    [handleNext, handlePrev, isTransitioning]
  );

  const currentTip = tips[activeIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Tips</Text>
      <View style={[styles.tipCard, { width: cardWidth }]} {...panResponder.panHandlers}>
        <Animated.View style={{ opacity: contentOpacity }}>
          <View style={styles.tipHeaderRow}>
            <Text style={styles.tipTitle} numberOfLines={2}>
              {currentTip.emoji} {currentTip.title}
            </Text>
            <View style={styles.tipNavWrap}>
              <Pressable
                style={({ pressed }) => [styles.tipNavBtn, pressed && styles.tipNavBtnPressed]}
                onPress={handlePrev}
                disabled={isTransitioning || activeIndex === 0}
                accessibilityRole="button"
                accessibilityLabel="Previous tip"
              >
                <Text style={[styles.tipNavText, activeIndex === 0 && styles.tipNavDisabled]}>‹</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.tipNavBtn, pressed && styles.tipNavBtnPressed]}
                onPress={handleNext}
                disabled={isTransitioning || activeIndex === tips.length - 1}
                accessibilityRole="button"
                accessibilityLabel="Next tip"
              >
                <Text style={[styles.tipNavText, activeIndex === tips.length - 1 && styles.tipNavDisabled]}>›</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.tipBody}>{currentTip.description}</Text>
        </Animated.View>

        <View style={styles.dotRow}>
          {tips.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <View key={index} style={[styles.dot, isActive && styles.dotActive]} />
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.xs,
  },
  sectionLabel: {
    alignSelf: "flex-start",
    width: "100%",
    paddingHorizontal: 0,
    marginBottom: moderateScale(8),
    fontSize: moderateScale(15),
    fontFamily: fontFamily.heading,
    color: asl.text.primary,
    letterSpacing: 0.2,
  },
  tipCard: {
    backgroundColor: asl.glass.bg,
    borderWidth: StyleSheet.hairlineWidth + 1,
    borderColor: asl.glass.border,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(14),
    borderRadius: asl.radius.lg,
    overflow: "hidden",
    ...asl.shadow.card,
  },
  tipHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: moderateScale(6),
    gap: moderateScale(8),
  },
  tipTitle: {
    flex: 1,
    fontSize: moderateScale(15),
    lineHeight: moderateScale(20),
    color: asl.text.primary,
    fontFamily: fontFamily.heading,
  },
  tipNavWrap: {
    flexDirection: "row",
    gap: moderateScale(6),
    flexShrink: 0,
  },
  tipNavBtn: {
    width: moderateScale(28),
    height: moderateScale(28),
    borderRadius: moderateScale(14),
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tipNavBtnPressed: {
    opacity: 0.75,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  tipNavText: {
    fontSize: moderateScale(18),
    color: asl.text.primary,
    marginTop: moderateScale(-1),
    fontFamily: fontFamily.medium,
  },
  tipNavDisabled: {
    opacity: 0.28,
  },
  tipBody: {
    fontSize: moderateScale(13),
    color: asl.text.secondary,
    lineHeight: moderateScale(19),
    marginBottom: moderateScale(10),
    fontFamily: fontFamily.body,
  },
  dotRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: moderateScale(6),
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: moderateScale(14),
    backgroundColor: asl.accentCyan,
    borderRadius: moderateScale(4),
  },
});
