import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  useWindowDimensions,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  ScreenContainer,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import {
  getDeviceDensity,
  moderateScale,
  semanticColors,
} from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { ALPHABET_LEARN_ITEMS } from "@/src/features/learn/data/alphabet";
import { setLessonStepProgress } from "@/src/features/learn/utils/lessonProgress";

export default function AlphabetLearnScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const { profile } = useAuthUser();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const currentItem = ALPHABET_LEARN_ITEMS[currentIndex];
  React.useEffect(() => {
    // Entering the first screen means 0/3 screens completed so far.
    void setLessonStepProgress("alphabet", 0);
  }, []);

  const total = ALPHABET_LEARN_ITEMS.length;
  const progress = ((currentIndex + 1) / total) * 100;

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      return;
    }

    // Only mark screen 1 complete after the final card.
    void setLessonStepProgress("alphabet", 1);
    router.push("/learn/alphabet/type");
  };

  return (
    <ScreenContainer backgroundColor="#EEF3F1">
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace("/(tabs)/learn")}>
          <MaterialIcons name="chevron-left" size={28} color="#FFFFFF" />
        </Pressable>

        <Text style={styles.headerTitle}>Alphabet</Text>

        <View style={styles.headerRight}>
          <HeaderActionButton
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings" as any)}
          />
          <HeaderAvatarButton
            avatar={headerProfileIcon.emoji}
            onPress={() => router.push("/(tabs)/account")}
          />
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.progressTopRow}>
          <Text style={styles.progressLabel}>Learn</Text>
          <Text style={styles.progressCount}>
            {currentIndex + 1}/{total}
          </Text>
        </View>

        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>

        <View style={styles.card}>
          <View style={styles.imageFrame}>
            <Image
              source={currentItem.image}
              style={styles.lessonImage}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.subtitle}>Watch and learn this sign</Text>
          <Text style={styles.letterText}>{currentItem.letter}</Text>
        </View>

        <Pressable style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === total - 1 ? "Finish" : "Next"}
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      paddingHorizontal: ms(16),
      paddingBottom: ms(10),
      paddingTop: ms(10),
      gap: ms(12),
    },
    backButton: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      fontSize: ts(18),
      fontWeight: "800",
      color: "#334155",
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(6),
    },
    content: {
      flex: 1,
      paddingBottom: ms(16),
    },
    progressTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: ms(16),
      marginTop: ms(6),
    },
    progressLabel: {
      fontSize: ts(12),
      fontWeight: "700",
      color: "#334155",
    },
    progressCount: {
      fontSize: ts(12),
      fontWeight: "700",
      color: "#334155",
    },
    progressTrack: {
      height: ms(8),
      borderRadius: ms(99),
      backgroundColor: "#F4B7A0",
      marginHorizontal: ms(16),
      marginTop: ms(6),
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      backgroundColor: "#56BDB4",
      borderRadius: ms(99),
    },
    card: {
      flex: 1,
      marginTop: ms(14),
      marginHorizontal: ms(16),
      backgroundColor: "#FAFAFA",
      borderRadius: ms(24),
      paddingHorizontal: ms(16),
      paddingVertical: ms(16),
      alignItems: "center",
      justifyContent: "center",
    },
    lessonImage: {
      width: "100%",
      height: "100%",
    },
    imageFrame: {
      width: "100%",
      maxWidth: ms(260),
      height: ms(260),
      marginBottom: ms(12),
      borderRadius: ms(18),
      backgroundColor: "#F7F7F7",
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
      padding: ms(8),
    },
    subtitle: {
      fontSize: ts(13),
      fontWeight: "600",
      color: "#64748B",
      textAlign: "center",
    },
    letterText: {
      marginTop: ms(4),
      fontSize: ts(24),
      fontWeight: "800",
      color: semanticColors.text.primary,
      textAlign: "center",
    },
    nextButton: {
      marginTop: ms(12),
      marginHorizontal: ms(16),
      height: ms(52),
      borderRadius: ms(22),
      backgroundColor: "#56BDB4",
      alignItems: "center",
      justifyContent: "center",
    },
    nextButtonText: {
      color: "#FFFFFF",
      fontSize: ts(16),
      fontWeight: "700",
    },
  });
};