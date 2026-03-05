import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signupColors as c } from "@/src/theme/pages/signup.colors";

export default function SignupScreen() {
  return (
    <LinearGradient colors={[c.backgroundTop, c.backgroundBottom]} style={{ flex: 1 }}>
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/signese-logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Sign up</Text>
        <Text style={styles.subtitle}>Create your account</Text>
        {/* TODO: Add signup form inputs */}
        <Text style={styles.placeholder}>Implement sign-up form here.</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: c.cardBackground,
    margin: 16,
    borderRadius: 12,
  },
  logo: {
    width: 80,
    height: 80,
    alignSelf: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    color: c.titleText,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: "center",
    color: c.inputText,
  },
  placeholder: {
    textAlign: "center",
    color: c.linkText,
  },
});