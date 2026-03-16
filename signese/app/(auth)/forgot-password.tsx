import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { signupColors as c } from "@/src/theme/pages/signup.colors";
import { resetPassword } from "@/src/services/firebase/auth.services";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleReset = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    try {
      await resetPassword(email.trim().toLowerCase());
      setInfo("Password reset email sent.");
    } catch (e: any) {
      setError(e?.message ?? "Could not send reset email.");
    }
  };

  return (
    <LinearGradient colors={[c.backgroundTop, c.backgroundBottom]} locations={[0, 1]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="chevron-left" size={moderateScale(20)} color={c.titleText} />
          </Pressable>
        </View>
        <View style={styles.centerWrap}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>A reset link will be sent to your email.</Text>
          <View style={styles.card}>
            <Text style={styles.label}>Email</Text>
            <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={c.placeholderText} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
            {error ? <Text style={[styles.label, { color: "#ff4d4f", marginBottom: moderateScale(6) }]}>{error}</Text> : null}
            {info ? <Text style={[styles.label, { color: "#22c55e", marginBottom: moderateScale(6) }]}>{info}</Text> : null}
            <Pressable style={styles.primaryBtn} onPress={handleReset}><Text style={styles.primaryBtnText}>Send Reset Link</Text></Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const headingFont = Platform.select({ ios: "AvenirNext-Bold", android: "sans-serif-medium", default: "System" });
const bodyFont = Platform.select({ ios: "AvenirNext-Regular", android: "sans-serif", default: "System" });
const mediumFont = Platform.select({ ios: "AvenirNext-DemiBold", android: "sans-serif-medium", default: "System" });
const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  topRow: {
    paddingHorizontal: moderateScale(16),
    paddingTop: Platform.select({ ios: moderateScale(6), android: moderateScale(10), default: moderateScale(10) }),
  },
  backBtn: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: c.backButton,
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(16),
  },
  title: {
    fontSize: moderateScale(28),
    color: c.titleText,
    fontFamily: headingFont,
    fontWeight: "700",
    marginBottom: moderateScale(5),
  },
  subtitle: {
    fontSize: moderateScale(14),
    color: c.subtitleText,
    marginBottom: moderateScale(10),
    textAlign: "center",
    fontFamily: bodyFont,
  },
  card: {
    width: "100%",
    maxWidth: moderateScale(340),
    backgroundColor: c.cardBackground,
    borderRadius: moderateScale(24),
    padding: moderateScale(14),
  },
  label: {
    fontSize: moderateScale(10),
    color: c.labelText,
    marginBottom: moderateScale(3),
    fontFamily: mediumFont,
  },
  input: {
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    marginBottom: moderateScale(5),
    backgroundColor: c.inputBackground,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(13),
    color: c.inputText,
    fontFamily: bodyFont,
  },
  primaryBtn: {
    marginTop: moderateScale(8),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: c.primaryButton,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    fontSize: moderateScale(15),
    fontWeight: "700",
    color: c.buttonText,
    fontFamily: mediumFont,
  },
});
