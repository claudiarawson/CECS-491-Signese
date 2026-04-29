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
import { semanticColors, Spacing, moderateScale, fontFamily } from "@/src/theme";

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

  const goToSlide = useCallback((newIndex: number) => {
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
  }, [activeIndex, tips.length, contentOpacity, isTransitioning]);

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
      <View style={[styles.tipCard, { width: cardWidth }]} {...panResponder.panHandlers}>
        <Animated.View style={{ opacity: contentOpacity }}>
          <View style={styles.tipHeaderRow}>
            <Text style={styles.tipTitle}>
              {currentTip.emoji} {currentTip.title}
            </Text>
            <View style={styles.tipNavWrap}>
              <Pressable 
                style={({ pressed }) => [styles.tipNavBtn, pressed && styles.tipNavBtnPressed]}
                onPress={handlePrev}
                disabled={isTransitioning || activeIndex === 0}
              >
                <Text style={[styles.tipNavText, activeIndex === 0 && styles.tipNavDisabled]}>‹</Text>
              </Pressable>
              <Pressable 
                style={({ pressed }) => [styles.tipNavBtn, pressed && styles.tipNavBtnPressed]}
                onPress={handleNext}
                disabled={isTransitioning || activeIndex === tips.length - 1}
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
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                ]}
              />
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
  tipCard: {
    backgroundColor: "#F2E7BF",
    padding: moderateScale(12),
    borderRadius: moderateScale(16),
    overflow: "hidden",
  },
  tipHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(4),
  },
  tipTitle: {
    fontSize: moderateScale(14),
    color: semanticColors.text.primary,
    flex: 1,
    fontFamily: fontFamily.heading,
  },
  tipNavWrap: {
    flexDirection: "row",
    gap: moderateScale(4),
  },
  tipNavBtn: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#F8F8F8",
    alignItems: "center",
    justifyContent: "center",
  },
  tipNavBtnPressed: {
    opacity: 0.7,
  },
  tipNavText: {
    fontSize: moderateScale(16),
    color: semanticColors.text.secondary,
    marginTop: -2,
    fontFamily: fontFamily.medium,
  },
  tipNavDisabled: {
    opacity: 0.3,
  },
  tipBody: {
    fontSize: moderateScale(12),
    color: semanticColors.text.secondary,
    lineHeight: moderateScale(16),
    marginBottom: moderateScale(8),
    fontFamily: fontFamily.body,
  },
  dotRow: {
    flexDirection: "row",
    alignSelf: "center",
    gap: moderateScale(4),
  },
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "#CFD3D1",
  },
  dotActive: {
    width: moderateScale(12),
    backgroundColor: "#23B58F",
  },
});
