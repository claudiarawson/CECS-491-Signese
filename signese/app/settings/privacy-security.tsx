import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Switch, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer, SectionCard } from "@/src/components/layout";
import { GradientBackground } from "@/src/components/asl";
import { Spacing, fontWeight } from "@/src/theme";
import {
  type SettingsPreferences,
  DEFAULT_SETTINGS_PREFERENCES,
  loadSettingsPreferences,
  saveSettingsPreferences,
} from "@/src/features/settings/preferences.service";
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

export default function PrivacySecurityScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <SettingsSubHeader title="Privacy & Security" styles={styles} iconColor={colors.text} />
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
                <View style={[styles.iconBox, { backgroundColor: colors.controlWell }]}>
                  <MaterialIcons name="analytics" size={20} color={colors.accentOrange} />
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

            <Pressable style={styles.row} onPress={() => router.push("/(tabs)/account")}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.controlWell }]}>
                  <MaterialIcons name="open-in-new" size={20} color={colors.accentYellow} />
                </View>
                <Text style={styles.rowLabel}>Account Settings</Text>
              </View>
            </Pressable>
          </SectionCard>
        </ScrollView>
      </ScreenContainer>
    </GradientBackground>
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
    container: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: 16,
      gap: 14,
      paddingBottom: 40,
    },
    heroCard: {
      paddingVertical: 16,
      gap: 4,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: "700",
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
