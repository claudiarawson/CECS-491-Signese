import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer, ScreenHeader, SectionCard } from "@/src/components/layout";
import {
  type SettingsPreferences,
  DEFAULT_SETTINGS_PREFERENCES,
  loadSettingsPreferences,
  saveSettingsPreferences,
} from "@/src/features/settings/preferences.service";

type State = {
  loading: boolean;
  prefs: SettingsPreferences;
};

export default function PrivacySecurityScreen() {
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
  };

  const privacy = state.prefs.privacy;

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Privacy & Security" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Privacy Controls</Text>
          <Text style={styles.heroSubtitle}>
            Manage analytics sharing and account-level security actions.
          </Text>
        </SectionCard>

        <SectionCard style={styles.sectionCard}>
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#F9F0D9" }]}>
              <MaterialIcons name="analytics" size={20} color="#E1B245" />
            </View>
            <Text style={styles.rowLabel}>Send Analytics Data</Text>
          </View>
          <View style={styles.switchSlot}>
            <Switch
              value={privacy.sendAnalyticsData}
              onValueChange={(value) =>
                void updatePrefs({
                  ...state.prefs,
                  privacy: { sendAnalyticsData: value },
                })
              }
              disabled={state.loading}
            />
          </View>
        </View>

        <Pressable
          style={styles.row}
          onPress={() => router.push("/(tabs)/account")}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconBox, { backgroundColor: "#F9F0D9" }]}>
              <MaterialIcons name="open-in-new" size={20} color="#E1B245" />
            </View>
            <Text style={styles.rowLabel}>Account Settings</Text>
          </View>
        </Pressable>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
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

