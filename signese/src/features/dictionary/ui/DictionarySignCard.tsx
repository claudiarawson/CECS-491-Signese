import { useTheme, type ThemeColors } from "@/src/contexts/ThemeContext";
import { asl } from "@/src/theme/aslConnectTheme";
import { moderateScale } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { Sign } from "../types";

type Props = {
  density: number;
  item: Sign;
  merged: Sign;
  isItemSaved: boolean;
  prefetch?: () => void;
  onPress: () => void;
  onToggleSave: () => void | Promise<void>;
};

export function DictionarySignCard({
  density,
  item,
  merged,
  isItemSaved,
  prefetch,
  onPress,
  onToggleSave,
}: Props) {
  const { colors, theme } = useTheme();
  const ms = useMemo(() => (n: number) => moderateScale(n) * density, [density]);
  const styles = useMemo(() => createStyles(density, colors, theme), [density, colors, theme]);

  const hasVideo = !!(merged.mediaUrl || merged.storagePath || merged.videoId);
  const playColor = colors.accentBlue;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        item.source === "community" && styles.cardCommunity,
        pressed && styles.cardPressed,
      ]}
      onPressIn={() => prefetch?.()}
      onPress={onPress}
    >
      <View style={styles.mediaPlaceholder}>
        {hasVideo ? (
          <>
            <MaterialIcons name="play-circle-filled" size={ms(42)} color={playColor} />
            <Text style={styles.mediaLabel}>Tap to preview</Text>
          </>
        ) : (
          <>
            <MaterialIcons name="movie" size={ms(38)} color={colors.subtext} />
            <Text style={styles.mediaLabelMuted}>No clip</Text>
          </>
        )}
        {item.source === "community" ? (
          <View style={styles.mediaCommunityBadge}>
            <Text style={styles.mediaCommunityBadgeText}>Community</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardWord} numberOfLines={1}>
        {merged.word}
      </Text>
      <Pressable
        onPress={() => void onToggleSave()}
        hitSlop={10}
        style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
        accessibilityLabel={isItemSaved ? "Remove from saved" : "Save sign"}
      >
        <View style={[styles.saveBtnGlass, isItemSaved && styles.saveBtnGlassOn]}>
          <Text style={styles.saveIcon}>{isItemSaved ? "★" : "☆"}</Text>
        </View>
      </Pressable>
    </Pressable>
  );
}

function createStyles(density: number, colors: ThemeColors, theme: "light" | "dark") {
  const ms = (value: number) => moderateScale(value) * density;
  const L = theme === "light";
  const mediaBg = L ? "rgba(15,23,42,0.08)" : "rgba(0,0,0,0.32)";
  const mediaBd = L ? colors.border : "rgba(255,255,255,0.14)";
  const saveBg = L ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.4)";
  const saveBd = L ? colors.border : asl.glass.border;
  const commBg = L ? "rgba(37, 99, 235, 0.12)" : "rgba(56, 189, 248, 0.14)";
  const commBd = L ? "rgba(37, 99, 235, 0.4)" : "rgba(56, 189, 248, 0.45)";
  const badgeFill = L ? "rgba(255,255,255,0.92)" : "rgba(0, 0, 0, 0.42)";

  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: ms(22),
      padding: ms(12),
      marginBottom: ms(12),
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      ...asl.shadow.card,
    },
    cardCommunity: {
      backgroundColor: commBg,
      borderColor: commBd,
    },
    cardPressed: {
      opacity: 0.93,
      transform: [{ scale: 0.99 }],
    },
    mediaPlaceholder: {
      height: ms(120),
      borderRadius: ms(18),
      backgroundColor: mediaBg,
      alignItems: "center",
      justifyContent: "center",
      gap: ms(8),
      borderWidth: 1,
      borderColor: mediaBd,
      overflow: "hidden",
    },
    mediaLabel: {
      color: colors.subtext,
      fontWeight: "600",
      fontSize: ms(11),
      letterSpacing: 0.4,
      textTransform: "uppercase",
    },
    mediaLabelMuted: {
      color: colors.subtext,
      fontWeight: "600",
      fontSize: ms(11),
    },
    mediaCommunityBadge: {
      position: "absolute",
      bottom: ms(8),
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: ms(999),
      backgroundColor: badgeFill,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: commBd,
    },
    mediaCommunityBadgeText: {
      color: colors.accentBlue,
      fontSize: ms(10),
      fontWeight: "800",
      letterSpacing: 0.35,
      textTransform: "uppercase",
    },
    cardWord: {
      marginTop: ms(10),
      fontSize: ms(22),
      fontWeight: "900",
      textAlign: "center",
      color: colors.text,
    },
    saveBtn: {
      position: "absolute",
      top: ms(8),
      right: ms(8),
    },
    saveBtnGlass: {
      width: ms(42),
      height: ms(42),
      borderRadius: ms(21),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: saveBd,
      backgroundColor: saveBg,
      ...asl.shadow.card,
    },
    saveBtnGlassOn: {
      borderColor: L ? "rgba(202, 138, 4, 0.65)" : "rgba(251, 191, 36, 0.65)",
      backgroundColor: L ? "rgba(202, 138, 4, 0.18)" : "rgba(251, 191, 36, 0.16)",
    },
    saveBtnPressed: {
      opacity: 0.82,
      transform: [{ scale: 0.97 }],
    },
    saveIcon: {
      fontSize: ms(26),
      color: colors.accentYellow,
    },
  });
}
