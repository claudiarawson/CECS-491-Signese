import React, { useState, useMemo } from "react";
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
  updateAccountPassword,
  getAuthErrorMessage,
  userHasPasswordProvider,
} from "@/src/services/firebase/auth.services";
import {
  AccountSubScreenHeader,
  createAccountEditFormStyles,
} from "@/src/features/account/accountEditShared";

export default function ChangePasswordScreen() {
  const { authUser, refreshProfile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAccountEditFormStyles(density, textScale), [density, textScale]);

  const canChange = userHasPasswordProvider(authUser);

  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    if (!authUser || busy) return;
    setErr("");
    if (!passwordCurrent) {
      setErr("Enter your current password.");
      return;
    }
    if (passwordNew.length < 6) {
      setErr("New password should be at least 6 characters.");
      return;
    }
    if (passwordCurrent === passwordNew) {
      setErr("New password must be different from your current password.");
      return;
    }
    if (passwordNew !== passwordConfirm) {
      setErr("New passwords do not match.");
      return;
    }
    try {
      setBusy(true);
      await updateAccountPassword(authUser, passwordCurrent, passwordNew);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
      await refreshProfile();
      Alert.alert("Success", "Your password was updated.");
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
        <AccountSubScreenHeader title="Password" />
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
              <Text style={styles.sectionKicker}>Password</Text>
              {canChange ? (
                <>
                  <Text style={styles.fieldHint}>Use at least 6 characters.</Text>
                  <Text style={styles.inputLabel}>Current password</Text>
                  <TextInput
                    value={passwordCurrent}
                    onChangeText={(t) => {
                      setPasswordCurrent(t);
                      if (err) setErr("");
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={asl.text.muted}
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!!authUser && !busy}
                  />
                  <Text style={styles.inputLabel}>New password</Text>
                  <TextInput
                    value={passwordNew}
                    onChangeText={(t) => {
                      setPasswordNew(t);
                      if (err) setErr("");
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={asl.text.muted}
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!!authUser && !busy}
                  />
                  <Text style={styles.inputLabel}>Confirm new password</Text>
                  <TextInput
                    value={passwordConfirm}
                    onChangeText={(t) => {
                      setPasswordConfirm(t);
                      if (err) setErr("");
                    }}
                    placeholder="••••••••"
                    placeholderTextColor={asl.text.muted}
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
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
                      <Text style={styles.primaryBtnText}>Update password</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text style={styles.fieldHintMuted}>
                  Password changes apply to email sign-in only. OAuth accounts use the provider&apos;s
                  security settings.
                </Text>
              )}
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </GradientBackground>
  );
}
