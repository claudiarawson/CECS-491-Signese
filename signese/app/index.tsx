import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { moderateScale } from "react-native-size-matters";
import { fontWeight } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

export default function Index() {
  return (
    <LinearGradient colors={[...asl.welcome]} style={styles.bg}>
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
    flex: 1},
  safe: {
    flex: 1},
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(28)},
  logo: {
    width: moderateScale(90),
    height: moderateScale(90),
    borderRadius: moderateScale(45),
    overflow: "hidden",
    marginBottom: moderateScale(20),
    borderWidth: 2,
    borderColor: "rgba(244, 114, 182, 0.35)"},
  title: {
    fontSize: moderateScale(40),
    letterSpacing: 1,
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: fontWeight.emphasis},
  subtitle: {
    marginTop: moderateScale(10),
    fontSize: moderateScale(16),
    lineHeight: moderateScale(22),
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    maxWidth: moderateScale(280)},
  actions: {
    width: "100%",
    maxWidth: moderateScale(320),
    marginTop: moderateScale(40),
    gap: moderateScale(16)},
  signupButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    backgroundColor: "#EC4899",
    alignItems: "center",
    justifyContent: "center"},
  signupText: {
    fontSize: moderateScale(18),
    textAlign: "center",
    color: "#FFFFFF",
    fontWeight: fontWeight.emphasis},
  loginButton: {
    height: moderateScale(50),
    borderRadius: moderateScale(25),
    borderWidth: 1.5,
    borderColor: "rgba(244, 114, 182, 0.85)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center"},
  loginText: {
    fontSize: moderateScale(18),
    textAlign: "center",
    color: "#F9A8D4",
    fontWeight: fontWeight.medium}});