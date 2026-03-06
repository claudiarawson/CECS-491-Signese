import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";

export default function AddDialectScreen() {
  const [word, setWord] = useState("");
  const [media, setMedia] = useState(""); // placeholder for now
  const [definition, setDefinition] = useState("");
  const [howToSign, setHowToSign] = useState("");
  const [note, setNote] = useState("");

  const onPickMedia = () => {
    Alert.alert("Media", "Media picker not implemented yet.");
  };

  const onSubmit = () => {
    Alert.alert(
      "Submitted (UI Only)",
      `Word: ${word}\nMedia: ${media}\nDefinition: ${definition}\nHow: ${howToSign}\nNote: ${note}`
    );
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Text style={styles.iconText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Add Community Sign</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Word / Sign</Text>
        <TextInput
          value={word}
          onChangeText={setWord}
          placeholder="e.g., Hello"
          style={styles.input}
        />

        <Text style={styles.label}>Media (placeholder)</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TextInput
            value={media}
            onChangeText={setMedia}
            placeholder="paste a URL or leave blank"
            style={[styles.input, { flex: 1 }]}
          />
          <Pressable onPress={onPickMedia} style={styles.smallBtn}>
            <Text style={styles.smallBtnText}>Upload</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Definition</Text>
        <TextInput
          value={definition}
          onChangeText={setDefinition}
          placeholder="What does it mean?"
          style={[styles.input, styles.multi]}
          multiline
        />

        <Text style={styles.label}>How to Sign</Text>
        <TextInput
          value={howToSign}
          onChangeText={setHowToSign}
          placeholder="Step-by-step instructions"
          style={[styles.input, styles.multi]}
          multiline
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="Any extra info"
          style={[styles.input, styles.multi]}
          multiline
        />

        <Pressable onPress={onSubmit} style={styles.submitBtn}>
          <Text style={styles.submitText}>Submit Sign</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4fbfa", padding: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "900", color: "#0b0b0b" },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eef7f6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 18, fontWeight: "900" },

  label: { marginTop: 14, fontSize: 14, fontWeight: "900", color: "#0b0b0b" },
  input: {
    marginTop: 8,
    backgroundColor: "#e6f4f2",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#0b0b0b",
  },
  multi: { minHeight: 90, textAlignVertical: "top" },

  smallBtn: {
    alignSelf: "stretch",
    marginTop: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#48b4a8",
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtnText: { color: "white", fontWeight: "900" },

  submitBtn: {
    marginTop: 20,
    backgroundColor: "#48b4a8",
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
  },
  submitText: { color: "white", fontWeight: "900", fontSize: 16 },
});