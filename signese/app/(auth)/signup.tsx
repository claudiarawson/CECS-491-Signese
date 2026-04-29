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
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import { GlassCard, GradientBackground, InputField } from "@/src/components/asl";
import { signUpWithEmail } from "@/src/services/firebase/auth.services";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { createAuthScreenStyles } from "@/src/features/auth/authStyles";

export default function SignupScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refreshProfile } = useAuthUser();

  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAuthScreenStyles(density), [density]);
  const keyboardOffset = moderateScale(12) * density;

  const handleSignUp = async () => {
    if (submitting) return;
    setError("");

    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
      setError("Username, email, and both password fields are required.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2}$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const commonDomainFixes: Record<string, string> = {
      "gmaill.com": "gmail.com",
      "gmail.co": "gmail.com",
      "gmial.com": "gmail.com",
      "gnail.com": "gmail.com",
      "hotnail.com": "hotmail.com",
      "outlok.com": "outlook.com",
      "yaho.com": "yahoo.com",
    };

    const [localPart, domainPart] = trimmedEmail.split("@");

    if (domainPart && commonDomainFixes[domainPart]) {
      setError(`Did you mean ${localPart}@${commonDomainFixes[domainPart]}?`);
      return;
    }

    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      const result = await signUpWithEmail(trimmedEmail, password, trimmedUsername);
      console.log("signed up uid:", result.user.uid);
      await refreshProfile();
      router.replace("/(tabs)/home" as any);
    } catch (e: any) {
      console.log("SIGNUP ERROR FULL:", e);

      switch (e?.code) {
        case "auth/email-already-in-use":
          setError("That email is already in use.");
          break;
        case "auth/invalid-email":
          setError("That email address is invalid.");
          break;
        case "auth/weak-password":
          setError("Password should be at least 6 characters.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Check your connection and try again.");
          break;
        default:
          setError("Sign up failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
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
              disabled={submitting}
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
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Join Signese and start learning ASL</Text>

              <GlassCard style={{ alignSelf: "stretch" }}>
                <InputField
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="learner"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />
                <InputField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  editable={!submitting}
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>Password</Text>
                </View>
                <View style={[styles.passwordWrap, submitting && { opacity: 0.7 }]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={asl.text.muted}
                    secureTextEntry={!showPassword}
                    style={styles.passwordInput}
                    autoComplete="new-password"
                    editable={!submitting}
                  />
                  <Pressable
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((s) => !s)}
                    disabled={submitting}
                    accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                  >
                    <MaterialIcons
                      name={showPassword ? "visibility" : "visibility-off"}
                      size={22}
                      color={asl.text.secondary}
                    />
                  </Pressable>
                </View>

                <InputField
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                  editable={!submitting}
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <Pressable
                  disabled={submitting}
                  onPress={handleSignUp}
                  style={({ pressed }) => [
                    styles.submitPress,
                    (pressed || submitting) && styles.submitDimmed,
                  ]}
                >
                  <LinearGradient
                    colors={asl.primaryButton as unknown as [string, string, ...string[]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color={asl.text.primary} />
                    ) : (
                      <Text style={styles.submitText}>Sign up</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                <View style={styles.linkRow}>
                  <Text style={styles.linkMuted}>Already have an account?</Text>
                  <Pressable onPress={() => router.push("/login" as any)} disabled={submitting}>
                    <Text style={styles.link}>Log in</Text>
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
