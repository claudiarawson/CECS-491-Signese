import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer } from "@/src/components/layout";
import { GlassCard, GradientBackground } from "@/src/components/asl";
import { Typography, fontWeight, Spacing } from "@/src/theme";

import {
  DEFAULT_PROFILE_ICON_ID,
  getProfileIconById,
  PROFILE_ICONS,
} from "@/src/features/account/types";
import {
  getCurrentUserProfileIcons,
  selectCurrentUserProfileIcon,
  unlockCurrentUserProfileIcon,
} from "@/src/features/account/profile.services";
import { ensureStarsDocument } from "@/src/features/gamification/stars.services";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { type ThemeColors, useTheme } from "@/src/contexts/ThemeContext";

type ScreenState = {
  loading: boolean;
  savingId: string | null;
  selectedIcon: string;
  unlockedIconIds: string[];
};

function EditProfileHeader({ styles }: { styles: ReturnType<typeof createStyles> }) {
  const { colors } = useTheme();
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Edit Profile
      </Text>
      <View style={styles.headerIconPlaceholder} />
    </View>
  );
}

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, refreshProfile } = useAuthUser();
  const liveStars = profile?.stars?.balance ?? 0;

  const [state, setState] = useState<ScreenState>({
    loading: true,
    savingId: null,
    selectedIcon: DEFAULT_PROFILE_ICON_ID,
    unlockedIconIds: [DEFAULT_PROFILE_ICON_ID],
  });

  const loadData = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }));

    try {
      await ensureStarsDocument();

      const iconsState = await getCurrentUserProfileIcons();

      setState((current) => ({
        ...current,
        loading: false,
        selectedIcon: iconsState.selectedIcon,
        unlockedIconIds: iconsState.unlockedIconIds,
      }));
    } catch (error) {
      console.warn("Failed to load edit profile screen", error);
      setState((current) => ({ ...current, loading: false }));
      Alert.alert("Error", "Could not load profile icons.");
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  const handlePress = async (iconId: string) => {
    const icon = getProfileIconById(iconId);
    const isUnlocked = state.unlockedIconIds.includes(iconId);

    try {
      setState((current) => ({ ...current, savingId: iconId }));

      if (!isUnlocked) {
        if (liveStars < icon.starsRequired) {
          Alert.alert(
            "Not enough stars",
            `You need ${icon.starsRequired} stars to unlock ${icon.label}.`
          );
          return;
        }

        const updatedIcons = await unlockCurrentUserProfileIcon(iconId);

        setState((current) => ({
          ...current,
          unlockedIconIds: updatedIcons.unlockedIconIds,
        }));

        Alert.alert("Unlocked", `${icon.label} is now available.`);
      }

      await selectCurrentUserProfileIcon(iconId);
      await refreshProfile();

      setState((current) => ({
        ...current,
        selectedIcon: iconId,
      }));
    } catch (error) {
      console.warn("Profile icon action failed", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Could not update profile icon."
      );
    } finally {
      setState((current) => ({ ...current, savingId: null }));
    }
  };

  const selectedIcon = getProfileIconById(state.selectedIcon);

  if (state.loading) {
    return (
      <GradientBackground variant="default" style={{ flex: 1 }}>
        <ScreenContainer
          backgroundColor="transparent"
          safeStyle={{ backgroundColor: "transparent" }}
          contentStyle={styles.screenContent}
          contentPadded={false}
        >
          <EditProfileHeader styles={styles} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
            <Text style={styles.loadingText}>Loading profile icons...</Text>
          </View>
        </ScreenContainer>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <EditProfileHeader styles={styles} />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stack}>
            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerFlush}>
              <View style={styles.profileRow}>
                <View style={styles.heroAvatarWrap}>
                  <Text style={styles.heroEmoji}>{selectedIcon.emoji}</Text>
                </View>
                <View style={styles.profileTexts}>
                  <Text style={styles.heroLabel}>Selected: {selectedIcon.label}</Text>
                  <Text style={styles.starsText}>⭐ Available stars: {liveStars}</Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Profile Icons</Text>
              {PROFILE_ICONS.map((icon, index) => {
                const isUnlocked = state.unlockedIconIds.includes(icon.id);
                const isSelected = state.selectedIcon === icon.id;
                const isBusy = state.savingId === icon.id;

                return (
                  <React.Fragment key={icon.id}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.iconRow,
                        isSelected && styles.iconRowSelected,
                        !isUnlocked && styles.iconRowLocked,
                        pressed && { opacity: 0.9 },
                      ]}
                      onPress={() => void handlePress(icon.id)}
                      disabled={isBusy}
                    >
                      <View style={styles.iconWrap}>
                        <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                      </View>

                      <View style={styles.iconTextCol}>
                        <Text style={styles.iconLabel}>{icon.label}</Text>
                        <Text style={styles.statusText}>
                          {isUnlocked
                            ? isSelected
                              ? "Selected"
                              : "Tap to select"
                            : `Unlock for ${icon.starsRequired} stars`}
                        </Text>
                      </View>

                      {isBusy ? (
                        <ActivityIndicator color={colors.accentBlue} />
                      ) : isSelected ? (
                        <MaterialIcons name="check-circle" size={22} color={colors.accentBlue} />
                      ) : (
                        <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
                      )}
                    </Pressable>
                    {index < PROFILE_ICONS.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </React.Fragment>
                );
              })}
            </GlassCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    screenContent: {
      flex: 1,
      backgroundColor: "transparent",
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenPadding,
      minHeight: 52,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.headerScrim,
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: colors.text,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: fontWeight.emphasis,
    },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerIconPlaceholder: {
      width: 40,
      height: 40,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 40,
    },
    stack: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: 16,
      gap: 14,
    },
    cardOuter: {
      marginBottom: 0,
    },
    cardInnerFlush: {
      padding: 16,
    },
    cardInnerTight: {
      paddingVertical: 6,
      paddingHorizontal: 16,
    },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.subtext,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    heroAvatarWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: `${colors.primary}2E`,
      borderWidth: 2,
      borderColor: `${colors.primary}66`,
      alignItems: "center",
      justifyContent: "center",
    },
    profileTexts: {
      flex: 1,
      minWidth: 0,
    },
    heroEmoji: {
      fontSize: 36,
    },
    heroLabel: {
      ...Typography.sectionTitle,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: fontWeight.emphasis,
      color: colors.text,
    },
    starsText: {
      ...Typography.caption,
      marginTop: 6,
      fontSize: 14,
      lineHeight: 20,
      color: colors.subtext,
    },
    sectionKicker: {
      ...Typography.caption,
      color: colors.subtext,
      fontWeight: fontWeight.strong,
      fontSize: 12,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 10,
    },
    iconRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 56,
      paddingVertical: 10,
      gap: 12,
    },
    iconRowSelected: {
      backgroundColor: `${colors.accentBlue}0F`,
      borderRadius: 12,
      paddingHorizontal: 8,
    },
    iconRowLocked: {
      opacity: 0.86,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: `${colors.accentBlue}1F`,
      alignItems: "center",
      justifyContent: "center",
    },
    iconEmoji: {
      fontSize: 24,
    },
    iconTextCol: {
      flex: 1,
      minWidth: 0,
    },
    iconLabel: {
      ...Typography.body,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: fontWeight.medium,
      color: colors.text,
    },
    statusText: {
      ...Typography.caption,
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      color: colors.subtext,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 52,
    },
  });
