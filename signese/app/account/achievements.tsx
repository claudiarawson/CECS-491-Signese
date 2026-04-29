import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useFocusEffect } from "expo-router";
import { ScreenContainer } from "@/src/components/layout";
import { asl } from "@/src/theme/aslConnectTheme";
import { GlassCard, GradientBackground } from "@/src/components/asl";
import { Typography, fontWeight, Spacing } from "@/src/theme";
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  syncAndGetCurrentUserAchievements,
  type AchievementSummary,
} from "@/src/features/account/achievements.service";

function AchievementsHeader() {
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
        Achievements
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
      <GradientBackground variant="default" style={{ flex: 1 }}>
        <ScreenContainer
          backgroundColor="transparent"
          safeStyle={{ backgroundColor: "transparent" }}
          contentStyle={styles.screenContent}
          contentPadded={false}
        >
          <AchievementsHeader />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={asl.accentCyan} />
            <Text style={styles.helper}>Loading achievements...</Text>
          </View>
        </ScreenContainer>
      </GradientBackground>
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
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <AchievementsHeader />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.stack}>
            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerFlush}>
              <Text style={styles.title}>Badge Collection</Text>
              <View style={styles.heroMetaRow}>
                <Text style={styles.heroEmoji}>🏅</Text>
                <Text style={styles.metaText}>
                  Earned {earnedBadges.length}/{BADGE_DEFINITIONS.length} badges
                </Text>
              </View>
              <View style={styles.statsGrid}>
                <MilestonePill title="Lessons" value={summary?.metrics.lessonsCompleted ?? 0} />
                <MilestonePill title="Stars" value={summary?.metrics.starsEarned ?? 0} />
                <MilestonePill title="Streak" value={summary?.metrics.currentStreak ?? 0} />
              </View>
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Milestones</Text>
              <View style={styles.milestoneGroupRow}>
                <MilestoneGroupPill title="Lessons" badges={grouped.lessons} earned={earned} />
                <MilestoneGroupPill title="Stars" badges={grouped.stars} earned={earned} />
                <MilestoneGroupPill title="Streaks" badges={grouped.streak} earned={earned} />
              </View>
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Earned Badges</Text>
              {earnedBadges.length === 0 ? (
                <Text style={styles.emptyText}>No badges earned yet. Keep learning!</Text>
              ) : (
                earnedBadges.map((badge, index) => (
                  <React.Fragment key={badge.id}>
                    <BadgeRow badge={badge} earned />
                    {index < earnedBadges.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </React.Fragment>
                ))
              )}
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Locked Badges</Text>
              {lockedBadges.map((badge, index) => (
                <React.Fragment key={badge.id}>
                  <BadgeRow badge={badge} earned={false} />
                  {index < lockedBadges.length - 1 ? <View style={styles.rowDivider} /> : null}
                </React.Fragment>
              ))}
            </GlassCard>
          </View>
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

function MilestonePill({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statPillTitle}>{title}</Text>
      <Text style={styles.statPillValue}>{value}</Text>
    </View>
  );
}

function MilestoneGroupPill({
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
    <View style={styles.groupPill}>
      <Text style={styles.groupPillTitle}>{title}</Text>
      <Text style={styles.groupPillValue}>
        {completed}/{badges.length}
      </Text>
    </View>
  );
}

function BadgeRow({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  return (
    <View style={styles.badgeRow}>
      <View style={styles.badgeIconWrap}>
        <Text style={styles.emoji}>{earned ? badge.icon : "🔒"}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.rowTitle}>{badge.title}</Text>
        <Text style={styles.rowText}>{badge.description}</Text>
      </View>
      <Text style={[styles.statusText, earned ? styles.statusEarned : styles.statusLocked]}>
        {earned ? "Earned" : "Locked"}
      </Text>
    </View>
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
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: fontWeight.emphasis,
    color: asl.text.primary,
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  heroEmoji: {
    fontSize: 24,
  },
  helper: {
    fontSize: 15,
    color: asl.text.secondary,
  },
  metaText: {
    marginTop: 4,
    fontSize: 13,
    color: asl.text.muted,
    fontWeight: fontWeight.medium,
  },
  statsGrid: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  statPill: {
    flex: 1,
    backgroundColor: asl.glass.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: asl.glass.border,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  statPillTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: asl.text.secondary,
  },
  statPillValue: {
    fontSize: 13,
    color: asl.accentCyan,
    fontWeight: fontWeight.emphasis,
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
  milestoneGroupRow: {
    flexDirection: "row",
    gap: 8,
  },
  groupPill: {
    flex: 1,
    backgroundColor: "rgba(34, 211, 238, 0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: asl.accentCyan,
    paddingVertical: 10,
    alignItems: "center",
    gap: 2,
  },
  groupPillTitle: {
    fontSize: 13,
    fontWeight: fontWeight.strong,
    color: asl.text.secondary,
  },
  groupPillValue: {
    fontSize: 13,
    color: asl.accentCyan,
    fontWeight: fontWeight.emphasis,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingVertical: 10,
    gap: 12,
  },
  badgeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(34, 211, 238, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
  },
  emoji: {
    fontSize: 22,
  },
  rowTitle: {
    ...Typography.body,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: fontWeight.medium,
    color: asl.text.primary,
  },
  rowText: {
    ...Typography.caption,
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: asl.text.muted,
  },
  emptyText: {
    ...Typography.caption,
    fontSize: 14,
    color: asl.text.secondary,
    paddingBottom: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: fontWeight.strong,
  },
  statusEarned: {
    color: asl.accentCyan,
  },
  statusLocked: {
    color: asl.text.muted,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: asl.glass.border,
    marginLeft: 52,
  },
});

