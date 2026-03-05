import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up (placeholder)</Text>
      <Text>Implement sign-up form here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
});