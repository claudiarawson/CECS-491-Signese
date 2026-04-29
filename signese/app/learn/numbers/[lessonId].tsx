import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AppShell } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";

export default function NumbersLessonScreen() {
  return (
    <AppShell
      scroll={false}
      header={null}
      variant="default"
    >
      <View style={styles.root}>
        <Text style={styles.title}>Numbers lesson</Text>
        <Text style={styles.subtitle}>Coming soon.</Text>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { color: "#000000", fontSize: 20, fontWeight: "800" },
  subtitle: { color: "#000000", marginTop: 8, fontSize: 14, textAlign: "center" },
});

