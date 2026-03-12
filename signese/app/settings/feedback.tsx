import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function FeedbackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feedback</Text>
      <Text style={styles.body}>
        Feedback form will go here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  body: { fontSize: 16, color: "#444" },
});