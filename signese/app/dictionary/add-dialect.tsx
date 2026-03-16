import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

export default function AddSignScreen() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [howToSign, setHowToSign] = useState("");
  const [note, setNote] = useState("");

  const handleAddMedia = () => {
    Alert.alert("Media", "Media upload not implemented yet.");
  };

  const handleSubmit = () => {
    if (!word.trim() || !definition.trim() || !howToSign.trim()) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    Alert.alert(
      "Sign Created",
      `Word: ${word}\nDefinition: ${definition}\nHow to Sign: ${howToSign}\nNote: ${note}`
    );
    // Clear form
    setWord("");
    setDefinition("");
    setHowToSign("");
    setNote("");
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>Add Sign</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Word and Media Row */}
        <View style={styles.row}>
          <TextInput
            style={styles.wordInput}
            value={word}
            onChangeText={setWord}
            placeholder="Enter word/sign"
            placeholderTextColor="#999"
          />
          <Pressable style={styles.mediaButton} onPress={handleAddMedia}>
            <Text style={styles.mediaButtonText}>📸</Text>
            <Text style={styles.mediaButtonLabel}>add media!</Text>
          </Pressable>
        </View>

        {/* Definition Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Definition</Text>
          <TextInput
            style={styles.textarea}
            value={definition}
            onChangeText={setDefinition}
            placeholder="Enter definition"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        {/* How to Sign Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How to Sign</Text>
          <TextInput
            style={styles.textarea}
            value={howToSign}
            onChangeText={setHowToSign}
            placeholder="Enter instructions"
            placeholderTextColor="#999"
            multiline
          />
        </View>

        {/* Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note</Text>
          <TextInput
            style={styles.textarea}
            value={note}
            onChangeText={setNote}
            placeholder="Add optional note"
            placeholderTextColor="#999"
            multiline
          />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>&lt;&lt; Back</Text>
        </Pressable>
        <Pressable style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit!</Text>
        </Pressable>
      </View>
    </View>
  );
}

const TEAL = "#48B4A8";
const MINT = "#BFE4DF";
const BG = "#F4FBFA";
const TEXT = "#0B0B0B";
const GRAY_MEDIA = "#D9D9D9";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    backgroundColor: TEAL,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
    alignItems: "flex-start",
  },
  wordInput: {
    flex: 1,
    backgroundColor: MINT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
  },
  mediaButton: {
    width: 100,
    height: 100,
    backgroundColor: GRAY_MEDIA,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: TEAL,
    justifyContent: "center",
    alignItems: "center",
  },
  mediaButtonText: {
    fontSize: 32,
  },
  mediaButtonLabel: {
    fontSize: 10,
    marginTop: 4,
    color: TEXT,
    fontWeight: "600",
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
    marginBottom: 8,
  },
  textarea: {
    backgroundColor: MINT,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
    minHeight: 100,
    textAlignVertical: "top",
  },
  bottomRow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: BG,
  },
  backButton: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  submitButton: {
    flex: 1,
    backgroundColor: TEAL,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});
