import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { GlassCard, GradientBackground, InputField, PrimaryButton } from "@/src/components/asl";
import { resetPassword } from "@/src/services/firebase/auth.services";
import { createAuthScreenStyles } from "./authStyles";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAuthScreenStyles(density), [density]);
  const keyboardOffset = moderateScale(12) * density;

  const handleReset = async () => {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }
    try {
      await resetPassword(email.trim().toLowerCase());
      setInfo("Check your inbox for a reset link.");
    } catch (e: any) {
      setError(e?.message ?? "Could not send reset email.");
    }
  };

  return (
    <GradientBackground variant="welcome">
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? keyboardOffset : 0}
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="chevron-left" size={22} color={asl.accentCyan} />
            </Pressable>
          </View>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.centerBlock}>
              <Text style={styles.title}>Reset password</Text>
              <Text style={styles.subtitle}>We will email you a link to choose a new password</Text>

              <GlassCard style={{ alignSelf: "stretch" }}>
                <InputField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                {info ? <Text style={styles.successText}>{info}</Text> : null}

                <PrimaryButton label="Send reset link" onPress={handleReset} style={{ alignSelf: "stretch" }} />

                <View style={styles.linkRow}>
                  <Pressable onPress={() => router.push("/login" as any)}>
                    <Text style={styles.link}>Back to log in</Text>
                  </Pressable>
                </View>
              </GlassCard>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GradientBackground>
  );
}
