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

export default function LoginScreen() {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSignIn = () => {
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

              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Sign in to continue learning!</Text>

              <View style={styles.card}>
                <Text style={styles.label}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Matthew"
                  placeholderTextColor={c.placeholder}
                  style={styles.input}
                />

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

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="........"
                    placeholderTextColor={c.placeholder}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                  />
                  <Pressable onPress={() => setShowPassword((value) => !value)}>
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={moderateScale(18)}
                      color={c.icon}
                    />
                  </Pressable>
                </View>

                <View style={styles.rowLinks}>
                  <Pressable
                    style={styles.rememberWrap}
                    onPress={() => setRememberMe((value) => !value)}
                  >
                    <View style={[styles.rememberDot, rememberMe && styles.rememberDotOn]} />
                    <Text style={styles.remember}>Remember me</Text>
                  </Pressable>

                  <Pressable onPress={() => router.push("/(auth)/forgot-password")}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                </View>
              </View>

                <Pressable style={styles.primaryBtn} onPress={handleSignIn}>
                  <Text style={styles.primaryBtnText}>Sign In</Text>
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
    marginBottom: moderateScale(6),
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
    fontSize: moderateScale(18),
    lineHeight: moderateScale(22),
    color: c.subtitle,
    marginTop: moderateScale(4),
    textAlign: "center",
    fontFamily: bodyFont,
  },

  card: {
    width: "100%",
    marginTop: moderateScale(10),
    backgroundColor: c.card,
    borderRadius: moderateScale(24),
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(16),
  },

  label: {
    fontSize: moderateScale(11),
    color: c.label,
    marginBottom: moderateScale(4),
    fontFamily: mediumFont,
  },

  input: {
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginBottom: moderateScale(6),
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingHorizontal: moderateScale(12),
    fontSize: moderateScale(13),
    color: c.title,
    fontFamily: bodyFont,
  },

  passwordWrap: {
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    marginBottom: moderateScale(6),
    backgroundColor: c.inputBg,
    borderWidth: 1,
    borderColor: c.inputBorder,
    paddingLeft: moderateScale(12),
    paddingRight: moderateScale(8),
    flexDirection: "row",
    alignItems: "center",
  },

  passwordInput: {
    flex: 1,
    fontSize: moderateScale(14),
    color: c.title,
    fontFamily: bodyFont,
  },

  rowLinks: {
    marginTop: moderateScale(4),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: moderateScale(6),
  },

  rememberWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(4),
  },

  rememberDot: {
    width: moderateScale(10),
    height: moderateScale(10),
    borderRadius: moderateScale(5),
    borderWidth: 1,
    borderColor: c.link,
    backgroundColor: "transparent",
  },

  rememberDotOn: {
    backgroundColor: c.link,
  },

  remember: {
    fontSize: moderateScale(12),
    color: c.subtitle,
    fontFamily: bodyFont,
  },

  link: {
    fontSize: moderateScale(12),
    color: c.link,
    fontWeight: "600",
    fontFamily: mediumFont,
  },

  primaryBtn: {
    marginTop: moderateScale(8),
    height: moderateScale(42),
    borderRadius: moderateScale(21),
    width: "72%",
    backgroundColor: c.primaryBtn,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryBtnText: {
    fontSize: moderateScale(16),
    fontFamily: mediumFont,
    fontWeight: "700",
    color: c.primaryBtnText,
    lineHeight: moderateScale(20),
  },
});
