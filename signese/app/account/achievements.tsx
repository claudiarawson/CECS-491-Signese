import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
  PROFILE_ICONS,
  getProfileIconById,
} from "@/src/features/account/types";
import { getCurrentUserProfileIcons } from "@/src/features/account/profile.services";
import { getCurrentUserStars } from "@/src/features/gamification/stars.services";
import { useAuthUser } from "@/src/contexts/AuthUserContext";

export default function AchievementsScreen() {
  const { profile } = useAuthUser();
  const [loading, setLoading] = useState(true);
  const [stars, setStars] = useState(0);
  const [unlockedIconIds, setUnlockedIconIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [iconState, starState] = await Promise.all([
        getCurrentUserProfileIcons(),
        getCurrentUserStars(),
      ]);

      setUnlockedIconIds(iconState.unlockedIconIds);
      setStars(starState.balance);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
        <Text style={styles.helper}>Loading achievements...</Text>
      </View>
    );
  }

  const selected = getProfileIconById(profile?.avatar);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Achievements</Text>
      <Text style={styles.helper}>Current stars: ⭐ {stars}</Text>
      <Text style={styles.helper}>
        Selected icon: {selected.emoji} {selected.label}
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unlocked Profile Icons</Text>
        {PROFILE_ICONS.filter((icon) => unlockedIconIds.includes(icon.id)).map(
          (icon) => (
            <View key={icon.id} style={styles.row}>
              <Text style={styles.emoji}>{icon.emoji}</Text>
              <Text style={styles.rowText}>{icon.label}</Text>
            </View>
          )
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Locked Profile Icons</Text>
        {PROFILE_ICONS.filter(
          (icon) => !unlockedIconIds.includes(icon.id)
        ).map((icon) => (
          <View key={icon.id} style={styles.row}>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={styles.rowText}>
              {icon.label} — requires {icon.starsRequired} stars
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 18,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  helper: {
    fontSize: 16,
    color: "#4B5563",
  },
  section: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  rowText: {
    fontSize: 16,
  },
});