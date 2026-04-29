import { AppShell, GlassCard, ToggleSwitch } from "@/src/components/asl";
import { MainTabRail } from "@/src/components/navigation";
import { Spacing, fontFamily, getDeviceDensity, moderateScale, Typography } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import {
  TranslationHistoryPanel,
  useTabTranslationHistory,
  type TranslationHistoryItem,
} from "@/src/features/translate/translationHistory";
import {
  ReportTranslationModal,
  type ReportTranslationContext,
} from "@/src/features/translate/ui/ReportTranslationModal";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TranslateHistoryScreen() {
  const { textScale } = useAccessibility();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createStyles(density, textScale), [density, textScale]);

  const {
    translationHistory,
    clearHistory,
    deleteHistoryItem,
    sessionId,
    keepHistoryOnDevice,
    setKeepHistoryOnDevice,
    historyPrefsLoaded,
    requestReuseCaption,
  } = useTabTranslationHistory();

  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<ReportTranslationContext | null>(null);

  const reservedForPrefsAndTab = moderateScale(200) * density;
  const listMaxHeight = Math.max(
    220,
    height - insets.bottom - moderateScale(120) * density - reservedForPrefsAndTab
  );

  const openReportForHistoryItem = useCallback(
    (item: TranslationHistoryItem) => {
      setReportContext({
        translationId: item.id,
        sourceText: item.originalText,
        translatedText: item.translatedText,
        sourceLanguage: item.sourceLanguage,
        targetLanguage: item.targetLanguage,
        sessionId,
      });
      setReportOpen(true);
    },
    [sessionId]
  );

  const handleReuseHistoryItem = useCallback(
    (item: TranslationHistoryItem) => {
      requestReuseCaption(item.translatedText);
      router.back();
    },
    [requestReuseCaption]
  );

  const handleDeleteHistoryItem = useCallback(
    (item: TranslationHistoryItem) => {
      deleteHistoryItem(item.id);
    },
    [deleteHistoryItem]
  );

  const handleDictionaryLookup = useCallback((item: TranslationHistoryItem) => {
    router.push({
      pathname: "/(tabs)/dictionary",
      params: { q: item.originalText },
    } as any);
  }, []);

  const header = (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={asl.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Recent translations
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <AppShell scroll={false} header={header} variant="default">
      <View style={styles.shellColumn}>
        <View style={styles.panelSlot}>
          <TranslationHistoryPanel
            items={translationHistory}
            onClear={clearHistory}
            onReuse={handleReuseHistoryItem}
            onDictionary={handleDictionaryLookup}
            onDelete={handleDeleteHistoryItem}
            onReportItem={openReportForHistoryItem}
            variant="stacked"
            listMaxHeight={listMaxHeight}
            textScale={textScale}
            appearance="dark"
            keepHistoryOnDevice={keepHistoryOnDevice}
          />
        </View>

        <GlassCard style={styles.historyPrefsCard} contentStyle={styles.historyPrefsInner}>
          <ToggleSwitch
            value={keepHistoryOnDevice}
            onValueChange={setKeepHistoryOnDevice}
            label="Keep history on device"
            description="Recent translations stay on this phone."
          />
          {!historyPrefsLoaded ? (
            <Text style={styles.prefsLoadingHint} accessibilityLiveRegion="polite">
              Loading preference…
            </Text>
          ) : null}
        </GlassCard>

        <View
          style={[
            styles.tabRailOuter,
            { marginBottom: Platform.OS === "ios" ? Math.max(insets.bottom, 10) : Math.max(insets.bottom, 12) },
          ]}
        >
          <MainTabRail />
        </View>
      </View>

      <ReportTranslationModal
        visible={reportOpen}
        onClose={() => {
          setReportOpen(false);
          setReportContext(null);
        }}
        context={reportContext}
      />
    </AppShell>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.sm,
      gap: ms(8),
    },
    backBtn: {
      padding: ms(4),
    },
    headerTitle: {
      ...Typography.sectionTitle,
      flex: 1,
      color: asl.text.primary,
      fontSize: ts(20),
      lineHeight: ts(24),
      fontWeight: "800",
      textAlign: "center",
    },
    headerSpacer: {
      width: ms(32),
    },
    shellColumn: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: Spacing.screenPadding,
      justifyContent: "flex-start",
    },
    panelSlot: {
      flex: 1,
      minHeight: 0,
    },
    historyPrefsCard: {
      marginTop: Spacing.sm,
      width: "100%",
    },
    historyPrefsInner: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
    },
    prefsLoadingHint: {
      ...Typography.caption,
      color: asl.text.muted,
      marginTop: ms(8),
      fontSize: ts(11),
      fontFamily: fontFamily.body,
    },
    tabRailOuter: {
      marginTop: Spacing.md,
      paddingHorizontal: ms(2),
    },
  });
};
