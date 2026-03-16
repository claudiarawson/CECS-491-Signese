<<<<<<< HEAD
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { signupColors as c } from "@/src/theme/pages/signup.colors";

export default function SignupScreen() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    // UI-only flow for now: enter the app shell and open Home tab.
    router.replace("/home");
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/");
  };

  return (
    <LinearGradient
      colors={[c.backgroundTop, c.backgroundBottom]}
      locations={[0, 1]}
      style={styles.bg}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.topRow}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialIcons
              name="chevron-left"
              size={moderateScale(20)}
              color={c.titleText}
            />
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

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Choose your avatar & get started!</Text>

              <View style={styles.card}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Matthew"
                  placeholderTextColor={c.placeholderText}
                  style={styles.input}
                />

                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={c.placeholderText}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.input}
                />

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="........"
                    placeholderTextColor={c.placeholderText}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((current) => !current)}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={moderateScale(18)}
                      color={c.icon}
                    />
                  </Pressable>
                </View>

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="........"
                  placeholderTextColor={c.placeholderText}
                  secureTextEntry
                  style={styles.input}
                />

                <Pressable style={styles.primaryBtn} onPress={handleSignUp}>
                  <Text style={styles.primaryBtnText}>Sign Up</Text>
                </Pressable>

                <View style={styles.bottomRow}>
                  <Text style={styles.bottomText}>Already have an account? </Text>
                  <Pressable onPress={() => router.push("/login")}>
                    <Text style={styles.link}>Login</Text>
                  </Pressable>
                </View>
              </View>
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
    backgroundColor: c.backButton,
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
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    overflow: "hidden",
    marginBottom: moderateScale(5),
  },

  title: {
    fontSize: moderateScale(28),
    lineHeight: moderateScale(32),
    fontFamily: headingFont,
    fontWeight: "700",
    letterSpacing: -0.2,
    textAlign: "center",
    color: c.titleText,
  },

  subtitle: {
    fontSize: moderateScale(16),
    lineHeight: moderateScale(20),
    marginTop: moderateScale(3),
    textAlign: "center",
    color: c.subtitleText,
    fontFamily: bodyFont,
  },

  card: {
    width: "100%",
    marginTop: moderateScale(8),
    backgroundColor: c.cardBackground,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(14),
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

  passwordWrap: {
    height: moderateScale(34),
    borderRadius: moderateScale(17),
    marginBottom: moderateScale(5),
    backgroundColor: c.inputBackground,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingLeft: moderateScale(12),
    paddingRight: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: moderateScale(13),
    color: c.inputText,
    fontFamily: bodyFont,
  },

  eyeBtn: {
    padding: moderateScale(2),
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
    lineHeight: moderateScale(18),
    fontFamily: mediumFont,
    fontWeight: "700",
    color: c.buttonText,
  },

  bottomRow: {
    marginTop: moderateScale(6),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  bottomText: {
    fontSize: moderateScale(11),
    color: c.labelText,
    fontFamily: bodyFont,
  },

  link: {
    fontSize: moderateScale(13),
    color: c.linkText,
    fontWeight: "600",
    fontFamily: mediumFont,
  },
=======
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800" },
>>>>>>> feature/dictionary-settings-nav
});