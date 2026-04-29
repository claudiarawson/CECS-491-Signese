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
import { updateUserUsername, getAuthErrorMessage } from "@/src/services/firebase/auth.services";
import {
  AccountSubScreenHeader,
  createAccountEditFormStyles,
} from "@/src/features/account/accountEditShared";

export default function DisplayNameScreen() {
  const { profile, authUser, refreshProfile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = useMemo(() => createAccountEditFormStyles(density, textScale), [density, textScale]);

  const [draft, setDraft] = useState(profile?.username ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (profile?.username !== undefined) {
      setDraft(profile.username);
    }
  }, [profile?.username]);

  const handleSave = async () => {
    if (!authUser || busy) return;
    setErr("");
    const next = draft.trim();
    if (next === (profile?.username ?? "").trim()) {
      setErr("No changes to save.");
      return;
    }
    try {
      setBusy(true);
      await updateUserUsername(authUser, next);
      await refreshProfile();
      Alert.alert("Success", "Your display name was updated.");
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
        <AccountSubScreenHeader title="Display name" />
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
              <Text style={styles.sectionKicker}>Display name</Text>
              <Text style={styles.fieldHint}>Shown across the app and saved to your profile.</Text>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={draft}
                onChangeText={(t) => {
                  setDraft(t);
                  if (err) setErr("");
                }}
                placeholder="Your name"
                placeholderTextColor={asl.text.muted}
                style={styles.textInput}
                autoCapitalize="words"
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
                  <Text style={styles.primaryBtnText}>Save name</Text>
                )}
              </Pressable>
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </ScreenContainer>
    </GradientBackground>
  );
}
