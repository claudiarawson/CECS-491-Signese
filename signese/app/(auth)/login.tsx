import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { GlassCard, GradientBackground, InputField, PrimaryButton } from "@/src/components/asl";
import { signInWithEmail } from "@/src/services/firebase/auth.services";
import { createAuthScreenStyles } from "@/src/features/auth/authStyles";

export default function LoginScreen() {
  const { redirect: redirectParam } = useLocalSearchParams<{ redirect?: string | string[] }>();
  const redirect = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAuthScreenStyles(density), [density]);
  const keyboardOffset = moderateScale(12) * density;

  const handleSignIn = async () => {
    setError("");
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }
    try {
      await signInWithEmail(email.trim().toLowerCase(), password);
      const next =
        typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/(tabs)/home";
      router.replace(next as any);
    } catch (e: any) {
      setError(e?.message ?? "Login failed.");
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
              <Image
                source={require("../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>Sign in to continue learning</Text>

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

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                </View>
                <View style={styles.passwordWrap}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={asl.text.muted}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    autoComplete="password"
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((s) => !s)}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color={asl.text.secondary}
                    />
                  </Pressable>
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <PrimaryButton label="Log in" onPress={handleSignIn} style={{ alignSelf: "stretch" }} />

                <View style={styles.linkRow}>
                  <Pressable onPress={() => router.push("/forgot-password" as any)}>
                    <Text style={styles.link}>Forgot password?</Text>
                  </Pressable>
                </View>

                <View style={styles.linkRow}>
                  <Text style={styles.linkMuted}>New here?</Text>
                  <Pressable onPress={() => router.push("/signup" as any)}>
                    <Text style={styles.link}>Create an account</Text>
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
