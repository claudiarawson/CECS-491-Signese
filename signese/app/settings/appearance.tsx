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

type State = {
  loading: boolean;
  prefs: SettingsPreferences;
};

export default function AppearanceScreen() {
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

  const appearance = state.prefs.appearance;

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Appearance" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard style={styles.heroCard}>
          <Text style={styles.heroTitle}>Theme Preferences</Text>
          <Text style={styles.heroSubtitle}>
            Pick the display style you want. Dark Mode and Classic Look are exclusive.
          </Text>
        </SectionCard>

        <SectionCard style={styles.sectionCard}>
        <SettingsToggleRow
          iconName="dark-mode"
          iconColor="#B192CE"
          iconBg="#E9E1F1"
          label="Dark Mode"
          value={appearance.darkMode}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              appearance: {
                darkMode: value,
                classicLook: value ? false : appearance.classicLook,
              },
            })
          }
        />

        <SettingsToggleRow
          iconName="style"
          iconColor="#B192CE"
          iconBg="#E9E1F1"
          label="Classic Look"
          value={appearance.classicLook}
          disabled={state.loading}
          onChange={(value) =>
            void updatePrefs({
              ...state.prefs,
              appearance: {
                darkMode: value ? false : appearance.darkMode,
                classicLook: value,
              },
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

