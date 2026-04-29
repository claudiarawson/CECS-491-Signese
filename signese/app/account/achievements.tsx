import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { GlassCard, GradientBackground } from "@/src/components/asl";
import { Typography, fontWeight, Spacing } from "@/src/theme";
import {
  BADGE_DEFINITIONS,
  type BadgeDefinition,
  syncAndGetCurrentUserAchievements,
  type AchievementSummary,
} from "@/src/features/account/achievements.service";
import { type ThemeColors, useTheme } from "@/src/contexts/ThemeContext";

function AchievementsHeader({ styles }: { styles: ReturnType<typeof createStyles> }) {
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
        Achievements
      </Text>
      <View style={styles.headerIconPlaceholder} />
    </View>
  );
}

export default function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
          <AchievementsHeader styles={styles} />
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.accentBlue} />
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
        <AchievementsHeader styles={styles} />
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
                <MilestonePill title="Lessons" value={summary?.metrics.lessonsCompleted ?? 0} styles={styles} />
                <MilestonePill title="Stars" value={summary?.metrics.starsEarned ?? 0} styles={styles} />
                <MilestonePill title="Streak" value={summary?.metrics.currentStreak ?? 0} styles={styles} />
              </View>
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Milestones</Text>
              <View style={styles.milestoneGroupRow}>
                <MilestoneGroupPill title="Lessons" badges={grouped.lessons} earned={earned} styles={styles} />
                <MilestoneGroupPill title="Stars" badges={grouped.stars} earned={earned} styles={styles} />
                <MilestoneGroupPill title="Streaks" badges={grouped.streak} earned={earned} styles={styles} />
              </View>
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Earned Badges</Text>
              {earnedBadges.length === 0 ? (
                <Text style={styles.emptyText}>No badges earned yet. Keep learning!</Text>
              ) : (
                earnedBadges.map((badge, index) => (
                  <React.Fragment key={badge.id}>
                    <BadgeRow badge={badge} earned styles={styles} />
                    {index < earnedBadges.length - 1 ? <View style={styles.rowDivider} /> : null}
                  </React.Fragment>
                ))
              )}
            </GlassCard>

            <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
              <Text style={styles.sectionKicker}>Locked Badges</Text>
              {lockedBadges.map((badge, index) => (
                <React.Fragment key={badge.id}>
                  <BadgeRow badge={badge} earned={false} styles={styles} />
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
  styles,
}: {
  title: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
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
  styles,
}: {
  title: string;
  badges: BadgeDefinition[];
  earned: string[];
  styles: ReturnType<typeof createStyles>;
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

function BadgeRow({
  badge,
  earned,
  styles,
}: {
  badge: BadgeDefinition;
  earned: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
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
    },
    title: {
      ...Typography.sectionTitle,
      fontSize: 24,
      lineHeight: 30,
      fontWeight: fontWeight.emphasis,
      color: colors.text,
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
      color: colors.subtext,
    },
    metaText: {
      marginTop: 4,
      fontSize: 13,
      color: colors.subtext,
      fontWeight: fontWeight.medium,
    },
    statsGrid: {
      flexDirection: "row",
      marginTop: 12,
      gap: 8,
    },
    statPill: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      alignItems: "center",
      gap: 2,
    },
    statPillTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.subtext,
    },
    statPillValue: {
      fontSize: 13,
      color: colors.accentBlue,
      fontWeight: fontWeight.emphasis,
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
    milestoneGroupRow: {
      flexDirection: "row",
      gap: 8,
    },
    groupPill: {
      flex: 1,
      backgroundColor: `${colors.accentBlue}14`,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.accentBlue,
      paddingVertical: 10,
      alignItems: "center",
      gap: 2,
    },
    groupPillTitle: {
      fontSize: 13,
      fontWeight: fontWeight.strong,
      color: colors.subtext,
    },
    groupPillValue: {
      fontSize: 13,
      color: colors.accentBlue,
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
      backgroundColor: `${colors.accentBlue}1F`,
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
      color: colors.text,
    },
    rowText: {
      ...Typography.caption,
      marginTop: 2,
      fontSize: 13,
      lineHeight: 18,
      color: colors.subtext,
    },
    emptyText: {
      ...Typography.caption,
      fontSize: 14,
      color: colors.subtext,
      paddingBottom: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: fontWeight.strong,
    },
    statusEarned: {
      color: colors.accentBlue,
    },
    statusLocked: {
      color: colors.subtext,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 52,
    },
  });
