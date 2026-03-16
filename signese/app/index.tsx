import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { landingColors as c } from "@/src/theme/pages/landing.colors";

export default function Index() {
  return (
    <LinearGradient colors={[c.bgTop, c.bgBottom]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>SIGNESE</Text>
          <Text style={styles.subtitle}>Learn American Sign Language the fun way!</Text>

          <View style={styles.actions}>
            <Pressable style={styles.signupButton} onPress={() => router.push("/signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </Pressable>

            <Pressable style={styles.loginButton} onPress={() => router.push("/login")}>
              <Text style={styles.loginText}>Login</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  safe: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(28),
  },
  logo: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    overflow: "hidden",
    marginBottom: moderateScale(20),
  },
  title: {
    fontSize: moderateScale(40),
    fontWeight: "700",
    letterSpacing: 1,
    textAlign: "center",
    color: c.logoText,
    fontFamily: "System",
  },
  subtitle: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(16),
    fontWeight: "400",
    lineHeight: moderateScale(22),
    textAlign: "center",
    color: c.subtitle,
    maxWidth: moderateScale(260),
    fontFamily: "System",
  },
  actions: {
    width: "100%",
    maxWidth: moderateScale(320),
    marginTop: moderateScale(40),
    gap: moderateScale(16),
  },
  signupButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: c.signupBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  signupText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    textAlign: "center",
    color: c.signupText,
    fontFamily: "System",
  },
  loginButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    borderWidth: 1.5,
    borderColor: c.loginBorder,
    backgroundColor: c.loginBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  loginText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    textAlign: "center",
    color: c.loginText,
    fontFamily: "System",
  },
});