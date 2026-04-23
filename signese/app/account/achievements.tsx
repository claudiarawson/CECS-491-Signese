import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  syncAndGetCurrentUserAchievements,
  type AchievementSummary,
} from "@/src/features/account/achievements.service";

export default function AchievementsScreen() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AchievementSummary | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const next = await syncAndGetCurrentUserAchievements();
      setSummary(next);
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
      <ScreenContainer backgroundColor="#F1F6F5">
        <ScreenHeader title="Achievements" showBackButton />
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.helper}>Loading achievements...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const earned = summary?.earnedBadgeIds ?? [];
  const earnedBadges = BADGE_DEFINITIONS.filter((badge) => earned.includes(badge.id));
  const lockedBadges = BADGE_DEFINITIONS.filter((badge) => !earned.includes(badge.id));

  const grouped = {
    lessons: BADGE_DEFINITIONS.filter((badge) => badge.id.startsWith("lessons_")),
    stars: BADGE_DEFINITIONS.filter((badge) => badge.id.startsWith("stars_")),
    streak: BADGE_DEFINITIONS.filter((badge) => badge.id.startsWith("streak_")),
  };

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Achievements" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Badge Collection</Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🏅</Text>
          <Text style={styles.heroTitle}>Your Progress</Text>
          <Text style={styles.helper}>
            Lessons completed: {summary?.metrics.lessonsCompleted ?? 0}
          </Text>
          <Text style={styles.helper}>
            Lifetime stars earned: ⭐ {summary?.metrics.starsEarned ?? 0}
          </Text>
          <Text style={styles.helper}>
            Current streak: 🔥 {summary?.metrics.currentStreak ?? 0}
          </Text>
          <Text style={styles.metaText}>
            Earned {earnedBadges.length}/{BADGE_DEFINITIONS.length} badges
          </Text>
        </View>

        <View style={styles.miniSection}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <View style={styles.milestoneGrid}>
            <MilestonePill title="Lessons" badges={grouped.lessons} earned={earned} />
            <MilestonePill title="Stars" badges={grouped.stars} earned={earned} />
            <MilestonePill title="Streaks" badges={grouped.streak} earned={earned} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned Badges</Text>
          {earnedBadges.length === 0 ? (
            <Text style={styles.emptyText}>No badges earned yet. Keep learning!</Text>
          ) : (
            earnedBadges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} earned />
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked Badges</Text>
          {lockedBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} earned={false} />
          ))}
        </View>

      </ScrollView>
    </ScreenContainer>
  );
}

function MilestonePill({
  title,
  badges,
  earned,
}: {
  title: string;
  badges: BadgeDefinition[];
  earned: string[];
}) {
  const completed = badges.filter((badge) => earned.includes(badge.id)).length;
  return (
    <View style={styles.milestonePill}>
      <Text style={styles.milestoneTitle}>{title}</Text>
      <Text style={styles.milestoneCount}>
        {completed}/{badges.length}
      </Text>
    </View>
  );
}

function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  return (
    <View style={[styles.badgeCard, earned ? styles.badgeEarned : styles.badgeLocked]}>
      <Text style={styles.emoji}>{earned ? badge.icon : "🔒"}</Text>
      <View style={styles.textWrap}>
        <Text style={styles.rowTitle}>{badge.title}</Text>
        <Text style={styles.rowText}>{badge.description}</Text>
        <Text style={styles.statusText}>{earned ? "Earned" : "Not earned yet"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
    paddingBottom: 24,
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
  heroCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "#F2F5F7",
    alignItems: "center",
    gap: 6,
  },
  heroEmoji: {
    fontSize: 42,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  helper: {
    fontSize: 15,
    color: "#374151",
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  miniSection: {
    gap: 10,
  },
  milestoneGrid: {
    flexDirection: "row",
    gap: 8,
  },
  milestonePill: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E1E8",
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  milestoneTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  milestoneCount: {
    fontSize: 13,
    color: "#0F766E",
    fontWeight: "700",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  badgeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  badgeEarned: {
    backgroundColor: "#EAF8F6",
    borderColor: "#43B3A8",
  },
  badgeLocked: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D8E1E8",
  },
  textWrap: {
    flex: 1,
  },
  emoji: {
    fontSize: 30,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  rowText: {
    fontSize: 14,
    color: "#4B5563",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  statusText: {
    marginTop: 4,
    fontSize: 12,
    color: "#51606D",
    fontWeight: "600",
  },
});

