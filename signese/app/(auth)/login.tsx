import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { loginColors as c } from "@/src/theme/pages/login.colors";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <LinearGradient
      colors={[c.bgStart, c.bgMid, c.bgEnd]}
      locations={[0, 0.5, 1]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        {/* Back button (top-left circle) */}
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
        </View>

        {/* Centered content (phone-width) */}
        <View style={styles.centerWrap}>
          <View style={styles.phoneWidth}>
            {/* Logo */}
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            {/* Title + subtitle */}
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue learning!</Text>

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={c.placeholder}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={c.placeholder}
                secureTextEntry
                style={styles.input}
              />

              <View style={styles.rowLinks}>
                <Pressable onPress={() => {}}>
                  <Text style={styles.remember}>○ Remember me</Text>
                </Pressable>

                <Pressable onPress={() => router.push("/forgot-password") }>
                  <Text style={styles.link}>Forgot password?</Text>
                </Pressable>
              </View>

              <Pressable style={styles.primaryBtn} onPress={() => {}}>
                <Text style={styles.primaryBtnText}>Sign In</Text>
              </Pressable>
            </View>

            {/* Bottom links */}
            <View style={styles.bottomLinks}>
              <Pressable onPress={() => router.push("/signup") }>
                <Text style={styles.link}>Create account</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  topRow: {
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 6, android: 10, default: 10 }),
  },

  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: c.backBg,
    alignItems: "center",
    justifyContent: "center",
  },

  backIcon: {
    fontSize: 26,
    lineHeight: 26,
    marginTop: -2,
    color: c.title,
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 12,
    paddingHorizontal: 16,
  },

  // This is the key to matching iPhone SE / Figma frame
  phoneWidth: {
    width: "100%",
    maxWidth: 320, // Figma frame width
    alignItems: "center",
  },

  logo: {
    width: 46,
    height: 46,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: c.title,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 13,
    color: c.subtitle,
    marginTop: 4,
    textAlign: "center",
  },

  card: {
    width: "100%",
    marginTop: 18,
    backgroundColor: c.card,
    borderRadius: 24, // matches Figma rounded card
    padding: 18,
  },

  label: {
    fontSize: 12,
    color: c.label,
    marginBottom: 6,
  },

  input: {
    height: 40,
    borderRadius: 20, // pill input
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingHorizontal: 14,
    color: c.title,
  },

  rowLinks: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  remember: {
    fontSize: 12,
    color: c.subtitle,
  },

  link: {
    fontSize: 12,
    color: c.link,
    fontWeight: "600",
  },

  primaryBtn: {
    marginTop: 16,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.primaryBtn,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: c.primaryBtnText,
  },

  bottomLinks: {
    marginTop: 14,
    alignItems: "center",
  },
});
