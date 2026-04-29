import React from "react";
import { View, Text, StyleSheet, Switch, ScrollView, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer, SectionCard } from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { GradientBackground } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";
import { Spacing, fontWeight } from "@/src/theme";

function SettingsSubHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
      >
        <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function AccessibilityScreen() {
  const {
    captions,
    tts,
    largeText,
    setCaptions,
    setTts,
    setLargeText,
    textScale,
  } = useAccessibility();

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
      <SettingsSubHeader title="Accessibility" />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard style={styles.heroCard}>
          <Text style={[styles.heroTitle, { fontSize: 20 * textScale }]}>
            Accessibility Options
          </Text>
          <Text style={[styles.heroSubtitle, { fontSize: 14 * textScale }]}>
            Configure captions, speech support, and larger text settings.
          </Text>
        </SectionCard>

        <SectionCard style={styles.sectionCard}>
          <ToggleRow
            label="Translate Captions"
            iconName="subtitles"
            iconColor="#F4A78E"
            value={captions}
            onChange={setCaptions}
            textScale={textScale}
          />

          <ToggleRow
            label="Translate Text-to-Speech"
            iconName="record-voice-over"
            iconColor="#F4A78E"
            value={tts}
            onChange={setTts}
            textScale={textScale}
          />

          <ToggleRow
            label="Larger Text"
            iconName="format-size"
            iconColor="#F4A78E"
            value={largeText}
            onChange={setLargeText}
            textScale={textScale}
          />
        </SectionCard>

        <SectionCard style={styles.previewCard}>
          <Text style={[styles.previewTitle, { fontSize: 18 * textScale }]}>Preview</Text>
          <Text style={[styles.previewText, { fontSize: 15 * textScale }]}>
            This text updates immediately when Larger Text is turned on.
          </Text>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
    </GradientBackground>
  );
}

function ToggleRow({
  label,
  iconName,
  iconColor,
  value,
  onChange,
  textScale,
}: {
  label: string;
  iconName: React.ComponentProps<typeof MaterialIcons>["name"];
  iconColor: string;
  value: boolean;
  onChange: (next: boolean) => void;
  textScale: number;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.leftSection}>
        <View style={styles.iconBox}>
          <MaterialIcons name={iconName} size={20 * textScale} color={iconColor} />
        </View>
        <Text style={[styles.label, { fontSize: 15 * textScale }]}>{label}</Text>
      </View>
      <View style={styles.switchSlot}>
        <Switch value={value} onValueChange={onChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: asl.text.primary,
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
    alignItems: "center",
    gap: 4,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  heroTitle: {
    fontWeight: "800",
    color: asl.text.primary,
  },
  heroSubtitle: {
    color: asl.text.secondary,
    textAlign: "center",
  },
  sectionCard: {
    paddingVertical: 12,
    gap: 10,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  row: {
    minHeight: 68,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 8,
    gap: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#fde7dd",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontWeight: "500",
    color: asl.text.primary,
    flexShrink: 1,
  },
  switchSlot: {
    minWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  previewCard: {
    paddingVertical: 16,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  previewTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: asl.text.primary,
  },
  previewText: {
    color: asl.text.secondary,
    fontWeight: "500",
  },
});