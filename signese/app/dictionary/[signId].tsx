import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SignDetailScreen() {
  const { signId } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Detail</Text>
      <Text>ID: {signId}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
});