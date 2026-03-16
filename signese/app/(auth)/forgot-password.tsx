<<<<<<< HEAD
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Image,
  Platform,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { loginColors as c } from "@/src/theme/pages/login.colors";
import { typography } from "@/src/theme";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  const handleResetPassword = () => {
    // TODO: Implement password reset logic
    console.log("Reset password for:", email);
  };

  return (
    <LinearGradient
      colors={[c.bgStart, c.bgMid, c.bgEnd]}
      locations={[0, 0.5, 1]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={moderateScale(20)} color={c.title} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.centerWrap}>
            <View style={styles.phoneWidth}>
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />

              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email and we'll send you a reset link
              </Text>

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
              </View>

              <Pressable style={styles.primaryBtn} onPress={handleResetPassword}>
                <Text style={styles.primaryBtnText}>Send Reset Link</Text>
              </Pressable>

              <Pressable onPress={() => router.push("/(auth)/login")} style={styles.backToLogin}>
                <Text style={styles.link}>Back to Login</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const headingFont = Platform.select({
  ios: "AvenirNext-Bold",
  android: "sans-serif-medium",
  default: "System",
});
const bodyFont = Platform.select({
  ios: "AvenirNext-Regular",
  android: "sans-serif",
  default: "System",
});
const mediumFont = Platform.select({
  ios: "AvenirNext-DemiBold",
  android: "sans-serif-medium",
  default: "System",
});

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: moderateScale(14),
  },

  topRow: {
    paddingHorizontal: moderateScale(16),
    paddingTop: Platform.select({
      ios: moderateScale(6),
      android: moderateScale(10),
      default: moderateScale(10),
    }),
  },

  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: c.backBg,
    alignItems: "center",
    justifyContent: "center",
  },

  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: moderateScale(4),
    paddingHorizontal: moderateScale(16),
  },

  phoneWidth: {
    width: "100%",
    maxWidth: moderateScale(340),
    alignItems: "center",
  },

  logo: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    overflow: "hidden",
    marginBottom: moderateScale(8),
  },

  title: {
    fontSize: moderateScale(32),
    fontFamily: headingFont,
    fontWeight: "700",
    letterSpacing: -0.2,
    lineHeight: moderateScale(36),
    color: c.title,
    textAlign: "center",
  },

  subtitle: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
    color: c.subtitle,
    marginTop: moderateScale(6),
    marginBottom: moderateScale(16),
    textAlign: "center",
    fontFamily: bodyFont,
    paddingHorizontal: moderateScale(20),
  },

  card: {
    width: "100%",
    backgroundColor: c.card,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(18),
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateScale(16),
  },

  label: {
    fontSize: moderateScale(11),
    color: c.label,
    marginBottom: moderateScale(4),
    fontFamily: mediumFont,
  },

  input: {
    height: moderateScale(38),
    borderRadius: moderateScale(19),
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(13),
    color: c.title,
    fontFamily: bodyFont,
  },

  primaryBtn: {
    width: "100%",
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    backgroundColor: c.primaryBtn,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: moderateScale(16),
  },

  primaryBtnText: {
    ...typography.buttonPrimary,
    color: c.primaryBtnText,
  },

  backToLogin: {
    paddingVertical: moderateScale(8),
  },

  link: {
    fontSize: moderateScale(13),
    color: c.link,
    fontFamily: mediumFont,
    fontWeight: "600",
    textAlign: "center",
  },
=======
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800" },
>>>>>>> feature/dictionary-settings-nav
});