import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer } from "@/src/components/layout";
import { GradientBackground, GlassCard } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";
import { Spacing, fontWeight } from "@/src/theme";
import {
  type SettingsPreferences,
  DEFAULT_SETTINGS_PREFERENCES,
  loadSettingsPreferences,
  saveSettingsPreferences,
} from "@/src/features/settings/preferences.service";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { type ThemeColors, useTheme } from "@/src/contexts/ThemeContext";

type State = {
  loading: boolean;
  prefs: SettingsPreferences;
};

function SettingsSubHeader({
  title,
  styles,
  iconColor,
}: {
  title: string;
  styles: ReturnType<typeof createStyles>;
  iconColor: string;
}) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
      >
        <MaterialIcons name="arrow-back" size={22} color={iconColor} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { refreshStreakReminders } = useAuthUser();
  const [state, setState] = useState<State>({
    loading: true,
    prefs: DEFAULT_SETTINGS_PREFERENCES,
  });

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const loaded = await loadSettingsPreferences();
      if (!mounted) return;
      setState({ loading: false, prefs: loaded });
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const updatePrefs = async (next: SettingsPreferences) => {
    setState((current) => ({ ...current, prefs: next }));
    await saveSettingsPreferences(next);
    await refreshStreakReminders();
  };

  const notifications = state.prefs.notifications;

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <SettingsSubHeader title="Notifications" styles={styles} iconColor={colors.text} />
        <ScrollView contentContainerStyle={styles.container}>
          <GlassCard style={styles.heroCard}>
            <Text style={styles.heroTitle}>Notification Preferences</Text>
            <Text style={styles.heroSubtitle}>
              Choose the alerts and reminders you want from Signese.
            </Text>
          </GlassCard>

          <GlassCard style={styles.sectionCard}>
            <SettingsToggleRow
              iconName="notifications-none"
              iconColor={colors.accentBlue}
              iconBg={colors.controlWell}
              label="Push Notifications"
              value={notifications.pushNotifications}
              disabled={state.loading}
              onChange={(value) =>
                void updatePrefs({
                  ...state.prefs,
                  notifications: { ...notifications, pushNotifications: value },
                })
              }
              styles={styles}
            />

            <SettingsToggleRow
              iconName="menu-book"
              iconColor={colors.primary}
              iconBg={colors.controlWell}
              label="Daily Learn Reminders"
              value={notifications.dailyLearnReminders}
              disabled={state.loading}
              onChange={(value) =>
                void updatePrefs({
                  ...state.prefs,
                  notifications: { ...notifications, dailyLearnReminders: value },
                })
              }
              styles={styles}
            />

            <SettingsToggleRow
              iconName="local-fire-department"
              iconColor={colors.accentOrange}
              iconBg={colors.controlWell}
              label="Streak login reminders"
              value={notifications.streakLoginReminders}
              disabled={state.loading}
              onChange={(value) =>
                void updatePrefs({
                  ...state.prefs,
                  notifications: { ...notifications, streakLoginReminders: value },
                })
              }
              styles={styles}
            />

            <SettingsToggleRow
              iconName="manage-search"
              iconColor={colors.accentYellow}
              iconBg={colors.controlWell}
              label="Dictionary Post Notifications"
              value={notifications.dictionaryPostNotifications}
              disabled={state.loading}
              onChange={(value) =>
                void updatePrefs({
                  ...state.prefs,
                  notifications: { ...notifications, dictionaryPostNotifications: value },
                })
              }
              styles={styles}
            />
          </GlassCard>
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
  );
}

function SettingsToggleRow({
  iconName,
  iconColor,
  iconBg,
  label,
  value,
  disabled,
  onChange,
  styles,
}: {
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  iconBg: string;
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
          <MaterialIcons name={iconName} size={20} color={iconColor} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.switchSlot}>
        <Switch value={value} onValueChange={onChange} disabled={disabled} />
      </View>
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
    headerSpacer: {
      width: 40,
      height: 40,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    container: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: 16,
      gap: 12,
      paddingBottom: 40,
    },
    heroCard: {
      paddingVertical: 14,
      gap: 4,
      ...asl.shadow.card,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: fontWeight.emphasis,
      color: colors.text,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.subtext,
    },
    sectionCard: {
      paddingVertical: 12,
      gap: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    row: {
      minHeight: 68,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      borderRadius: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 8,
      gap: 8,
    },
    iconBox: {
      width: 30,
      height: 30,
      borderRadius: 4,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: "500",
      flexShrink: 1,
    },
    switchSlot: {
      minWidth: 56,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
  });
