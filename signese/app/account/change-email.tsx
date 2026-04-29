import React, { useEffect, useState, useMemo } from "react";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { GradientBackground, GlassCard } from "@/src/components/asl";
import { ScreenContainer } from "@/src/components/layout";
import { getDeviceDensity } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import {
  updateAccountEmail,
  getAuthErrorMessage,
  userHasPasswordProvider,
} from "@/src/services/firebase/auth.services";
import {
  AccountSubScreenHeader,
  createAccountEditFormStyles,
} from "@/src/features/account/accountEditShared";

export default function ChangeEmailScreen() {
  const { profile, authUser, refreshProfile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAccountEditFormStyles(density, textScale), [density, textScale]);

  const canChange = userHasPasswordProvider(authUser);

  const [newEmail, setNewEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (newEmail.trim() !== "") return;
    const next =
      (authUser?.email && authUser.email.trim() !== "" ? authUser.email : null) ??
      (profile?.email && profile.email.trim() !== "" ? profile.email : null);
    if (next) setNewEmail(next);
  }, [profile?.email, authUser?.email, newEmail]);

  const handleSave = async () => {
    if (!authUser || busy) return;
    setErr("");
    const trimmed = newEmail.trim().toLowerCase();
    const current = (authUser.email ?? "").trim().toLowerCase();
    if (trimmed === current) {
      setErr("Enter a different email address.");
      return;
    }
    if (!currentPassword) {
      setErr("Enter your current password to confirm.");
      return;
    }
    try {
      setBusy(true);
      await updateAccountEmail(authUser, trimmed, currentPassword);
      setCurrentPassword("");
      await refreshProfile();
      Alert.alert(
        "Verification sent",
        `We emailed a confirmation link to ${trimmed}. Open it to finish the change. Until then, sign in with your current email.`
      );
    } catch (e) {
      setErr(getAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
        <AccountSubScreenHeader title="Email" />
        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, styles.stack]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <GlassCard contentStyle={styles.cardInner}>
              <Text style={styles.sectionKicker}>Email</Text>
              {canChange ? (
                <>
                  <Text style={styles.fieldHint}>
                    We&apos;ll send a confirmation link to verify a new address.
                  </Text>
                  <Text style={styles.inputLabel}>New email</Text>
                  <TextInput
                    value={newEmail}
                    onChangeText={(t) => {
                      setNewEmail(t);
                      if (err) setErr("");
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor={asl.text.muted}
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!!authUser && !busy}
                  />
                  <Text style={styles.inputLabel}>Current password</Text>
                  <TextInput
                    value={currentPassword}
                    onChangeText={(t) => {
                      setCurrentPassword(t);
                      if (err) setErr("");
                    }}
                    placeholder="Required to confirm"
                    placeholderTextColor={asl.text.muted}
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!!authUser && !busy}
                  />
                  {err ? <Text style={styles.fieldError}>{err}</Text> : null}
                  <Pressable
                    style={[styles.primaryBtn, (!authUser || busy) && styles.btnDisabled]}
                    onPress={() => void handleSave()}
                    disabled={!authUser || busy}
                  >
                    {busy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Update email</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text style={styles.fieldHintMuted}>
                  You signed in with Google or another provider. Manage email in that account, or
                  contact support to add a password.
                </Text>
              )}
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </GradientBackground>
  );
}
