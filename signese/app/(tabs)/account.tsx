import React, { useState, useMemo, useCallback } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  getDeviceDensity,
  Typography,
  moderateScale,
  fontWeight,
  Spacing,
} from "@/src/theme";
import { getAuthErrorMessage, signOutUser, userHasPasswordProvider } from "@/src/services/firebase/auth.services";
import { getProfileIconById } from "@/src/features/account/types";
import { GlassCard, GradientBackground } from "@/src/components/asl";
import { ScreenContainer } from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { type ThemeColors, useTheme } from "@/src/contexts/ThemeContext";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { StarsProgressPanel } from "@/src/features/gamification/components/StarsProgressPanel";
import {
  getNextStarUnlockTarget,
  getUnlockedLessons,
} from "@/src/features/learn/utils/lessonProgress";

function AccountScreenHeader() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        headerStyles.row,
        { borderBottomColor: colors.border, backgroundColor: colors.headerScrim },
      ]}
    >
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          headerStyles.iconBtn,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={[headerStyles.title, { color: colors.text }]} numberOfLines={1}>
        Account
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/settings" as any)}
        style={({ pressed }) => [
          headerStyles.iconBtn,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && { opacity: 0.85 },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Open settings"
      >
        <MaterialIcons name="settings" size={22} color={colors.subtext} />
      </Pressable>
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
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

type LinkRowProps = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  subtitle?: string;
  onPress: () => void;
};

function AccountLinkRow({ icon, label, subtitle, onPress }: LinkRowProps) {
  const { colors, theme } = useTheme();
  const chipBg = theme === "light" ? "rgba(37, 99, 235, 0.14)" : "rgba(56, 189, 248, 0.12)";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [linkRowStyles.pressable, pressed && { opacity: 0.92 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[linkRowStyles.iconWrap, { backgroundColor: chipBg }]}>
        <MaterialIcons name={icon} size={22} color={colors.accentBlue} />
      </View>
      <View style={linkRowStyles.textCol}>
        <Text style={[linkRowStyles.label, { color: colors.text }]}>{label}</Text>
        {subtitle ? (
          <Text style={[linkRowStyles.subtitle, { color: colors.subtext }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <MaterialIcons name="chevron-right" size={22} color={colors.subtext} />
    </Pressable>
  );
}

const linkRowStyles = StyleSheet.create({
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 56,
    paddingVertical: 10,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...Typography.body,
    fontWeight: fontWeight.medium,
    fontSize: 16,
    lineHeight: 22,
  },
  subtitle: {
    ...Typography.caption,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});

export default function AccountScreen() {
  const { profile, authUser } = useAuthUser();
  const { textScale } = useAccessibility();
  const { theme, colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale, colors), [density, textScale, colors]);

  const selectedProfileIcon = getProfileIconById(profile?.avatar);

  const [signingOut, setSigningOut] = useState(false);
  const [nextUnlockTarget, setNextUnlockTarget] = useState<
    ReturnType<typeof getNextStarUnlockTarget>
  >(null);

  const dayStreak = profile?.streak?.current ?? 0;
  const canChangeEmailPassword = userHasPasswordProvider(authUser);

  const displayEmail =
    (authUser?.email && authUser.email.trim() !== "" ? authUser.email : null) ??
    (profile?.email && profile.email.trim() !== "" ? profile.email : null) ??
    null;

  const displayName = (profile?.username ?? "").trim() || "Learner";

  const passwordRowSubtitle = canChangeEmailPassword
    ? "Update your sign-in password"
    : "Managed by Google or other provider";

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const unlocked = await getUnlockedLessons();
          if (!cancelled) {
            setNextUnlockTarget(getNextStarUnlockTarget(unlocked));
          }
        } catch {
          if (!cancelled) {
            setNextUnlockTarget(null);
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOutUser();
      router.replace("/");
    } catch (e) {
      Alert.alert("Error", getAuthErrorMessage(e));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <AccountScreenHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.stack}>
              <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerFlush}>
                <View style={styles.profileRow}>
                  <View style={styles.heroAvatarWrap}>
                    <Text style={styles.heroAvatar}>{selectedProfileIcon.emoji}</Text>
                  </View>
                  <View style={styles.profileTexts}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {displayName}
                    </Text>
                    {displayEmail ? (
                      <Text style={styles.profileEmail} numberOfLines={2}>
                        {displayEmail}
                      </Text>
                    ) : (
                      <Text style={styles.profileEmailMuted}>No email on file</Text>
                    )}
                    <View style={styles.streakPill}>
                      <Text style={styles.streakEmoji}>🔥</Text>
                      <Text style={styles.streakValue}>{dayStreak}</Text>
                      <Text style={styles.streakLabel}>day streak</Text>
                    </View>
                  </View>
                </View>

                <StarsProgressPanel
                  style={styles.starsPanel}
                  variant="hero"
                  appearance={theme === "dark" ? "dark" : "light"}
                  totalEarned={profile?.stars?.lifetimeEarned ?? 0}
                  balance={profile?.stars?.balance ?? 0}
                  nextUnlock={
                    nextUnlockTarget
                      ? {
                          title: nextUnlockTarget.title,
                          starsRequired: nextUnlockTarget.starsRequired,
                          currentBalance: profile?.stars?.balance ?? 0,
                        }
                      : null
                  }
                />
              </GlassCard>

              <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
                <Text style={styles.sectionKicker}>Profile</Text>
                <AccountLinkRow
                  icon="face-retouching-natural"
                  label="Edit profile"
                  subtitle="Icons, appearance, and personalization"
                  onPress={() => router.push("/account/edit-profile")}
                />
                <View style={styles.rowDivider} />
                <AccountLinkRow
                  icon="emoji-events"
                  label="Achievements"
                  subtitle="Track milestones and rewards"
                  onPress={() => router.push("/account/achievements")}
                />
              </GlassCard>

              <GlassCard style={styles.cardOuter} contentStyle={styles.cardInnerTight}>
                <Text style={styles.sectionKicker}>Account</Text>
                <AccountLinkRow
                  icon="badge"
                  label="Display name"
                  subtitle={displayName}
                  onPress={() => router.push("/account/display-name" as any)}
                />
                <View style={styles.rowDivider} />
                <AccountLinkRow
                  icon="mail-outline"
                  label="Email"
                  subtitle={displayEmail ?? "Not set"}
                  onPress={() => router.push("/account/change-email" as any)}
                />
                <View style={styles.rowDivider} />
                <AccountLinkRow
                  icon="lock-outline"
                  label="Password"
                  subtitle={passwordRowSubtitle}
                  onPress={() => router.push("/account/change-password" as any)}
                />
              </GlassCard>

              <Pressable
                style={[styles.signOutBtn, signingOut && styles.signOutDisabled]}
                onPress={() => void handleSignOut()}
                disabled={signingOut}
                accessibilityRole="button"
                accessibilityLabel="Log out"
              >
                {signingOut ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="logout" size={22} color="#FFFFFF" />
                    <Text style={styles.signOutText}>Log out</Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (density: number, textScale: number, colors: ThemeColors) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    screenContent: {
      flex: 1,
      backgroundColor: "transparent",
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      // Keep content clear of bottom tab bar so the logout button is fully reachable.
      paddingBottom: ms(132),
    },
    stack: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(16),
      gap: ms(14),
    },
    cardOuter: {
      marginBottom: 0,
    },
    cardInnerTight: {
      paddingVertical: ms(6),
      paddingHorizontal: ms(16),
    },
    cardInnerFlush: {
      padding: ms(16),
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(14),
      marginBottom: ms(8),
    },
    heroAvatarWrap: {
      width: ms(72),
      height: ms(72),
      borderRadius: ms(36),
      backgroundColor: "rgba(244, 114, 182, 0.18)",
      borderWidth: 2,
      borderColor: "rgba(244, 114, 182, 0.4)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroAvatar: {
      fontSize: ts(36),
      lineHeight: ts(40),
    },
    profileTexts: {
      flex: 1,
      minWidth: 0,
    },
    profileName: {
      ...Typography.sectionTitle,
      color: colors.text,
      fontSize: ts(20),
      lineHeight: ts(26),
      fontWeight: fontWeight.emphasis,
    },
    profileEmail: {
      ...Typography.caption,
      color: colors.subtext,
      fontSize: ts(14),
      lineHeight: ts(20),
      marginTop: ms(4),
    },
    profileEmailMuted: {
      ...Typography.caption,
      color: colors.subtext,
      fontSize: ts(14),
      marginTop: ms(4),
    },
    streakPill: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      marginTop: ms(10),
      gap: 6,
      paddingHorizontal: ms(10),
      paddingVertical: ms(5),
      borderRadius: 999,
      backgroundColor: "rgba(251, 191, 36, 0.15)",
      borderWidth: 1,
      borderColor: "rgba(251, 191, 36, 0.35)",
    },
    streakEmoji: {
      fontSize: ts(14),
    },
    streakValue: {
      ...Typography.body,
      color: colors.accentYellow,
      fontWeight: fontWeight.emphasis,
      fontSize: ts(15),
    },
    streakLabel: {
      ...Typography.caption,
      color: colors.subtext,
      fontSize: ts(12),
    },
    starsPanel: {
      marginBottom: 0,
    },
    sectionKicker: {
      ...Typography.caption,
      color: colors.subtext,
      fontWeight: fontWeight.strong,
      fontSize: ts(12),
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: ms(10),
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginLeft: 52,
    },
    signOutBtn: {
      minHeight: ms(52),
      borderRadius: ms(14),
      backgroundColor: "rgba(214, 64, 69, 0.45)",
      borderWidth: 1,
      borderColor: "rgba(252, 165, 165, 0.45)",
      flexDirection: "row",
      gap: ms(10),
      alignItems: "center",
      justifyContent: "center",
      marginTop: ms(4),
    },
    signOutDisabled: {
      opacity: 0.5,
    },
    signOutText: {
      ...Typography.button,
      fontSize: ts(16),
      lineHeight: ts(22),
      color: "#FFFFFF",
      fontWeight: fontWeight.strong,
    },
  });
};
