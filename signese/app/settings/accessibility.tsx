import React from "react";
import { View, Text, StyleSheet, Switch, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer, ScreenHeader, SectionCard } from "@/src/components/layout";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

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
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Accessibility" showBackButton />
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
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
  },
  heroTitle: {
    fontWeight: "800",
    color: "#111827",
  },
  heroSubtitle: {
    color: "#4B5563",
    textAlign: "center",
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
    color: "#111827",
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
  },
  previewTitle: {
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  previewText: {
    color: "#334155",
    fontWeight: "500",
  },
});