import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, FlatList, ListRenderItemInfo, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import {
  useTabTranslationHistory,
  type TranslationHistoryItem,
} from "@/src/features/translate/translationHistory";
import { TranslationHistoryItemCard } from "@/src/features/translate/translationHistory/TranslationHistoryItemCard";
import {
  ReportTranslationModal,
  type ReportTranslationContext,
} from "@/src/features/translate/ui/ReportTranslationModal";
import { semanticColors, Spacing, Typography, getDeviceDensity } from "@/src/theme";

export default function TranslationHistoryScreen() {
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  const { translationHistory, deleteHistoryItem, sessionId } = useTabTranslationHistory();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportContext, setReportContext] = useState<ReportTranslationContext | null>(null);

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

  const handleDeleteHistoryItem = useCallback(
    (item: TranslationHistoryItem) => {
      deleteHistoryItem(item.id);
    },
    [deleteHistoryItem]
  );

  const handleDictionaryLookup = useCallback(
    (item: TranslationHistoryItem) => {
      // Navigate to dictionary page and prefill the search box
      router.push({
        pathname: "/(tabs)/dictionary",
        params: { q: item.originalText },
      } as any);
    },
    []
  );

  const renderItem = ({ item, index }: ListRenderItemInfo<TranslationHistoryItem>) => (
    <TranslationHistoryItemCard
      item={item}
      isNewest={index === 0}
      textScale={textScale}
      onDelete={handleDeleteHistoryItem}
      onReport={openReportForHistoryItem}
      onDictionary={handleDictionaryLookup}
    />
  );

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Translation History"
        left={
          <HeaderActionButton
            iconName="arrow-back-ios-new"
            onPress={() => router.back()}
          />
        }
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings" as any)}
            />
            <HeaderAvatarButton
              avatar={profile?.avatar}
              onPress={() => router.push("/(tabs)/account")}
            />
          </>
        }
        showBackButton={false}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Recent Translations</Text>
          <Text style={styles.subtitle}>This session only · not saved</Text>
        </View>

        {translationHistory.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="history" size={48} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No translations yet</Text>
            <Text style={styles.emptyDescription}>
              Go back to translate and record some clips to see your history here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={translationHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <ReportTranslationModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        context={reportContext}
      />
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) =>
  StyleSheet.create({
    content: {
      flex: 1,
      padding: Spacing.md,
    },
    header: {
      marginBottom: Spacing.lg,
      alignItems: "center",
    },
    title: {
      ...Typography.header,
      fontSize: 24 * textScale,
      color: semanticColors.text.primary,
      marginBottom: Spacing.xs,
    },
    subtitle: {
      ...Typography.body,
      fontSize: 14 * textScale,
      color: semanticColors.text.secondary,
    },
    empty: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
    },
    emptyTitle: {
      ...Typography.header,
      fontSize: 20 * textScale,
      color: semanticColors.text.primary,
      marginTop: Spacing.md,
      marginBottom: Spacing.sm,
    },
    emptyDescription: {
      ...Typography.body,
      fontSize: 16 * textScale,
      color: semanticColors.text.secondary,
      textAlign: "center",
    },
    list: {
      paddingBottom: Spacing.xl,
    },
  });