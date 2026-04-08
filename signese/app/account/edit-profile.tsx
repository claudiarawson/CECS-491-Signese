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
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";

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
      <ScreenContainer backgroundColor="#F1F6F5">
        <ScreenHeader title="Edit Profile" showBackButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading profile icons...</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Edit Profile" showBackButton />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Edit Profile Icon</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>{selectedIcon.emoji}</Text>
          <Text style={styles.heroLabel}>Selected: {selectedIcon.label}</Text>
          <Text style={styles.starsText}>⭐ Available Stars: {liveStars}</Text>
        </View>

        <View style={styles.grid}>
          {PROFILE_ICONS.map((icon) => {
            const isUnlocked = state.unlockedIconIds.includes(icon.id);
            const isSelected = state.selectedIcon === icon.id;
            const isBusy = state.savingId === icon.id;

            return (
              <Pressable
                key={icon.id}
                style={[
                  styles.iconCard,
                  isSelected && styles.iconCardSelected,
                  !isUnlocked && styles.iconCardLocked,
                ]}
                onPress={() => void handlePress(icon.id)}
                disabled={isBusy}
              >
                <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                <Text style={styles.iconLabel}>{icon.label}</Text>

                {isUnlocked ? (
                  <Text style={styles.statusText}>
                    {isSelected ? "Selected" : "Tap to select"}
                  </Text>
                ) : (
                  <Text style={styles.statusText}>
                    🔒 Unlock for {icon.starsRequired} stars
                  </Text>
                )}

                {isBusy ? <ActivityIndicator style={styles.inlineLoader} /> : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/account/achievements")}
        >
          <Text style={styles.secondaryButtonText}>View Achievements</Text>
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
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
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  heroCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F2F5F7",
    alignItems: "center",
    gap: 8,
  },
  heroEmoji: {
    fontSize: 48,
  },
  heroLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  starsText: {
    fontSize: 16,
  },
  grid: {
    gap: 12,
  },
  iconCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E1E8",
    gap: 6,
  },
  iconCardSelected: {
    borderColor: "#43B3A8",
    backgroundColor: "#EAF8F6",
  },
  iconCardLocked: {
    opacity: 0.9,
  },
  iconEmoji: {
    fontSize: 34,
  },
  iconLabel: {
    fontSize: 18,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 14,
    color: "#51606D",
  },
  inlineLoader: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#1F2937",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});