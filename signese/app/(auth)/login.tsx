import React, { useState } from "react";
import { View, Text, StyleSheet, Image, Pressable, Platform, TextInput, ScrollView, KeyboardAvoidingView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { signupColors as c } from "@/src/theme/pages/signup.colors";
import { signInWithEmail } from "@/src/services/firebase/auth.services";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      router.replace("/home"); // same route check
    } catch (e: any) {
      setError(e?.message ?? "Login failed.");
    }
  };

  return (
    <LinearGradient colors={[c.backgroundTop, c.backgroundBottom]} locations={[0, 1]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.keyboardWrap}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? moderateScale(12) : 0}
        >
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <MaterialIcons name="chevron-left" size={moderateScale(20)} color={c.titleText} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={styles.centerWrap}>
              <Image source={require("../../assets/images/logo.png")} style={styles.logo} resizeMode="contain" />
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
              <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <TextInput value={email} onChangeText={setEmail} placeholder="your@email.com" placeholderTextColor={c.placeholderText} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput value={password} onChangeText={setPassword} placeholder="........" placeholderTextColor={c.placeholderText} secureTextEntry={!showPassword} style={styles.passwordInput} />
                  <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((s) => !s)}>
                    <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={moderateScale(18)} color={c.inputText} />
                  </Pressable>
                </View>
                {error ? <Text style={[styles.label, { color: "#ff4d4f", marginBottom: moderateScale(6) }]}>{error}</Text> : null}
                <Pressable style={styles.primaryBtn} onPress={handleSignIn}><Text style={styles.primaryBtnText}>Login</Text></Pressable>
                <View style={styles.bottomRow}>
                  <Pressable onPress={() => router.push("/forgot-password")}><Text style={styles.link}>Forgot password?</Text></Pressable>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardWrap: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
  logo: { width: moderateScale(44), height: moderateScale(44), borderRadius: moderateScale(22), marginBottom: moderateScale(5) },
  title: { fontSize: moderateScale(28), color: c.titleText, fontFamily: headingFont, fontWeight: "700" },
  subtitle: { fontSize: moderateScale(16), color: c.subtitleText, marginBottom: moderateScale(11), fontFamily: bodyFont },
  card: { width: "100%", maxWidth: moderateScale(340), backgroundColor: c.cardBackground, borderRadius: moderateScale(24), padding: moderateScale(14) },
  label: { fontSize: moderateScale(10), color: c.labelText, marginBottom: moderateScale(3), fontFamily: mediumFont },
  input: { height: moderateScale(34), borderRadius: moderateScale(17), marginBottom: moderateScale(5), backgroundColor: c.inputBackground, borderWidth: 1, borderColor: c.inputBorder, paddingHorizontal: moderateScale(12), fontSize: moderateScale(13), color: c.inputText, fontFamily: bodyFont },
  passwordWrap: { height: moderateScale(34), borderRadius: moderateScale(17), marginBottom: moderateScale(5), backgroundColor: c.inputBackground, borderWidth: 1, borderColor: c.inputBorder, paddingLeft: moderateScale(12), paddingRight: moderateScale(8), flexDirection: "row", alignItems: "center" },
  passwordInput: { flex: 1, fontSize: moderateScale(13), color: c.inputText, fontFamily: bodyFont },
  eyeBtn: { padding: moderateScale(2) },
  primaryBtn: { marginTop: moderateScale(8), height: moderateScale(40), borderRadius: moderateScale(20), backgroundColor: c.primaryButton, alignItems: "center", justifyContent: "center" },
  primaryBtnText: { fontSize: moderateScale(15), fontWeight: "700", color: c.buttonText, fontFamily: mediumFont },
  bottomRow: { marginTop: moderateScale(8), alignItems: "center", justifyContent: "center" },
  link: { fontSize: moderateScale(13), color: c.linkText, fontWeight: "600", fontFamily: mediumFont },
});
