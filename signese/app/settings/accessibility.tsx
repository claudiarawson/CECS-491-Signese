import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
} from "react-native";
import { router } from "expo-router";

export default function AccessibilityScreen() {
  const [captions, setCaptions] = useState(true);
  const [tts, setTts] = useState(true);
  const [largeText, setLargeText] = useState(false);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Accessibility</Text>
      </View>

      {/* Translate Captions */}
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🤟</Text>
          </View>
          <Text style={styles.label}>Translate Captions</Text>
        </View>
        <Switch value={captions} onValueChange={setCaptions} />
      </View>

      {/* Translate Text-to-Speech */}
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>🤟</Text>
          </View>
          <Text style={styles.label}>Translate Text-to-Speech</Text>
        </View>
        <Switch value={tts} onValueChange={setTts} />
      </View>

      {/* Larger Text */}
      <View style={styles.card}>
        <View style={styles.leftSection}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>CC</Text>
          </View>
          <Text style={styles.label}>Larger Text</Text>
        </View>
        <Switch value={largeText} onValueChange={setLargeText} />
      </View>

      {/* Back Button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>&lt;&lt; Back</Text>
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
    fontSize: 22,
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
    fontSize: 18,
    color: "#f97316",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
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