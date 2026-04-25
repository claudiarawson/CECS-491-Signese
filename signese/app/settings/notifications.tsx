import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer, ScreenHeader, SectionCard } from "@/src/components/layout";
import {
  type SettingsPreferences,
  DEFAULT_SETTINGS_PREFERENCES,
  loadSettingsPreferences,
  saveSettingsPreferences,
} from "@/src/features/settings/preferences.service";
import { useAuthUser } from "@/src/contexts/AuthUserContext";

type State = {
  loading: boolean;
  prefs: SettingsPreferences;
};

export default function NotificationsScreen() {
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
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Notifications" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Notification Preferences</Text>
          <Text style={styles.heroSubtitle}>
            Choose the alerts and reminders you want from Signese. Streak reminders are a single
            local notification around 7:00 PM in your time zone (at most once per day on this
            device).
          </Text>
        </SectionCard>

        <SectionCard style={styles.sectionCard}>
        <SettingsToggleRow
          iconName="notifications-none"
          iconColor="#53B1A3"
          iconBg="#DDEFE9"
          label="Push Notifications"
          value={notifications.pushNotifications}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              notifications: { ...notifications, pushNotifications: value },
            })
          }
        />

        <SettingsToggleRow
          iconName="menu-book"
          iconColor="#53B1A3"
          iconBg="#DDEFE9"
          label="Daily Learn Reminders"
          value={notifications.dailyLearnReminders}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              notifications: { ...notifications, dailyLearnReminders: value },
            })
          }
        />

        <SettingsToggleRow
          iconName="local-fire-department"
          iconColor="#E25822"
          iconBg="#FCE7DC"
          label="Streak login reminders"
          value={notifications.streakLoginReminders}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              notifications: { ...notifications, streakLoginReminders: value },
            })
          }
        />

        <SettingsToggleRow
          iconName="manage-search"
          iconColor="#53B1A3"
          iconBg="#DDEFE9"
          label="Dictionary Post Notifications"
          value={notifications.dictionaryPostNotifications}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              notifications: { ...notifications, dictionaryPostNotifications: value },
            })
          }
        />
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
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
}: {
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  iconBg: string;
  label: string;
  value: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
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

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    paddingVertical: 16,
    gap: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#4B5563",
  },
  sectionCard: {
    paddingVertical: 12,
    gap: 10,
  },
  row: {
    minHeight: 68,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E1E8",
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
    color: "#111827",
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

