import React from "react";
import { View, Text, StyleSheet, Pressable, Switch } from "react-native";
import { router } from "expo-router";
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.headerText, { fontSize: 22 * textScale }]}>
          Accessibility
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={[styles.iconText, { fontSize: 18 * textScale }]}>🤟</Text>
          </View>
          <Text style={[styles.label, { fontSize: 16 * textScale }]}>
            Translate Captions
          </Text>
        </View>
        <Switch value={captions} onValueChange={setCaptions} />
      </View>

      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={[styles.iconText, { fontSize: 18 * textScale }]}>🤟</Text>
          </View>
          <Text style={[styles.label, { fontSize: 16 * textScale }]}>
            Translate Text-to-Speech
          </Text>
        </View>
        <Switch value={tts} onValueChange={setTts} />
      </View>

      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={[styles.iconText, { fontSize: 18 * textScale }]}>CC</Text>
          </View>
          <Text style={[styles.label, { fontSize: 16 * textScale }]}>
            Larger Text
          </Text>
        </View>
        <Switch value={largeText} onValueChange={setLargeText} />
      </View>

      <View style={styles.previewCard}>
        <Text style={[styles.previewTitle, { fontSize: 18 * textScale }]}>
          Preview
        </Text>
        <Text style={[styles.previewText, { fontSize: 15 * textScale }]}>
          This text updates immediately when Larger Text is turned on.
        </Text>
      </View>

      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={[styles.backText, { fontSize: 16 * textScale }]}>
          &lt;&lt; Back
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef7f6",
  },

  header: {
    backgroundColor: "#f3d6cc",
    paddingVertical: 20,
    alignItems: "center",
  },

  headerText: {
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 12,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#fde7dd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  iconText: {
    fontWeight: "700",
    color: "#f97316",
  },

  label: {
    fontWeight: "600",
    flexShrink: 1,
  },

  previewCard: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
  },

  previewTitle: {
    fontWeight: "700",
    marginBottom: 8,
  },

  previewText: {
    color: "#334155",
    fontWeight: "500",
  },

  backBtn: {
    marginTop: 40,
    marginLeft: 20,
    backgroundColor: "#4fa99b",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  backText: {
    color: "white",
    fontWeight: "700",
  },
});