import React, { useCallback, useEffect, useState } from "react";
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
import { asl } from "@/src/theme/aslConnectTheme";
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
import {
  ensureStarsDocument,
} from "@/src/features/gamification/stars.services";
import { useAuthUser } from "@/src/contexts/AuthUserContext";

type ScreenState = {
  loading: boolean;
  savingId: string | null;
  selectedIcon: string;
  unlockedIconIds: string[];
};

function EditProfileHeader() {
  return (
    <View style={headerStyles.row}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [headerStyles.iconBtn, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
      </Pressable>
      <Text style={headerStyles.title} numberOfLines={1}>
        Edit Profile
      </Text>
      <View style={headerStyles.iconBtnPlaceholder} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: asl.text.primary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnPlaceholder: {
    width: 40,
    height: 40,
  },
});

export default function EditProfileScreen() {
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
          <EditProfileHeader />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={asl.accentCyan} />
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
        <EditProfileHeader />
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
                        <ActivityIndicator color={asl.accentCyan} />
                      ) : isSelected ? (
                        <MaterialIcons name="check-circle" size={22} color={asl.accentCyan} />
                      ) : (
                        <MaterialIcons name="chevron-right" size={22} color={asl.text.muted} />
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

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    backgroundColor: "transparent",
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
    color: asl.text.secondary,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: asl.text.primary,
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
    backgroundColor: "rgba(244, 114, 182, 0.18)",
    borderWidth: 2,
    borderColor: "rgba(244, 114, 182, 0.4)",
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
    color: asl.text.primary,
  },
  starsText: {
    ...Typography.caption,
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: asl.text.secondary,
  },
  sectionKicker: {
    ...Typography.caption,
    color: asl.text.muted,
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
    backgroundColor: "rgba(34, 211, 238, 0.06)",
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
    backgroundColor: "rgba(34, 211, 238, 0.12)",
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
    color: asl.text.primary,
  },
  statusText: {
    ...Typography.caption,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: asl.text.muted,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: asl.glass.border,
    marginLeft: 52,
  },
});