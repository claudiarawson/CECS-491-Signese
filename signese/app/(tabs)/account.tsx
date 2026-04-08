import React, { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import {
  getDeviceDensity,
  semanticColors,
  Typography,
  moderateScale,
} from "@/src/theme";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  SectionCard,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import {
  updateUserUsername,
  updateAccountEmail,
  updateAccountPassword,
  getAuthErrorMessage,
  userHasPasswordProvider,
  signOutUser,
} from "@/src/services/firebase/auth.services";
import { getCurrentUserStars } from "@/src/features/gamification/stars.services";
import { getProfileIconById } from "@/src/features/account/types";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

export default function AccountScreen() {
  const { profile, authUser, refreshProfile } = useAuthUser();
  const { textScale } = useAccessibility();
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  const selectedProfileIcon = getProfileIconById(profile?.avatar);

  const [usernameDraft, setUsernameDraft] = useState(profile?.username ?? "");
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [usernameBusy, setUsernameBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [usernameErr, setUsernameErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [passwordErr, setPasswordErr] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  const [stars, setStars] = useState(0);

  useEffect(() => {
    let mounted = true;

    const loadStars = async () => {
      try {
        const result = await getCurrentUserStars();
        if (mounted) {
          setStars(result.balance);
        }
      } catch (error) {
        console.warn("Failed to load stars", error);
      }
    };

    void loadStars();

    return () => {
      mounted = false;
    };
  }, []);

  const dayStreak = 1;
  const canChangeEmailPassword = userHasPasswordProvider(authUser);

  useEffect(() => {
    if (profile?.username !== undefined) {
      setUsernameDraft(profile.username);
    }
  }, [profile?.username]);

  useEffect(() => {
    if (newEmail.trim() !== "") return;

    const next =
      (authUser?.email && authUser.email.trim() !== "" ? authUser.email : null) ??
      (profile?.email && profile.email.trim() !== "" ? profile.email : null);

    if (next) {
      setNewEmail(next);
    }
  }, [profile?.email, authUser?.email, newEmail]);

  const handleSaveUsername = async () => {
    if (!authUser || usernameBusy) return;

    setUsernameErr("");
    const next = usernameDraft.trim();

    if (next === (profile?.username ?? "").trim()) {
      setUsernameErr("No changes to save.");
      return;
    }

    try {
      setUsernameBusy(true);
      await updateUserUsername(authUser, next);
      await refreshProfile();
      Alert.alert("Success", "Your display name was updated.");
    } catch (e) {
      setUsernameErr(getAuthErrorMessage(e));
    } finally {
      setUsernameBusy(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!authUser || emailBusy) return;

    setEmailErr("");
    const trimmed = newEmail.trim().toLowerCase();
    const current = (authUser.email ?? "").trim().toLowerCase();

    if (trimmed === current) {
      setEmailErr("Enter a different email address.");
      return;
    }

    if (!emailCurrentPassword) {
      setEmailErr("Enter your current password to confirm.");
      return;
    }

    try {
      setEmailBusy(true);
      await updateAccountEmail(authUser, trimmed, emailCurrentPassword);
      setEmailCurrentPassword("");
      await refreshProfile();

      Alert.alert(
        "Verification sent",
        `We emailed a confirmation link to ${trimmed}. Open it to finish the change. Until then, sign in with your current email.`
      );
    } catch (e) {
      setEmailErr(getAuthErrorMessage(e));
    } finally {
      setEmailBusy(false);
    }
  };

  const handleSavePassword = async () => {
    if (!authUser || passwordBusy) return;

    setPasswordErr("");

    if (!passwordCurrent) {
      setPasswordErr("Enter your current password.");
      return;
    }

    if (passwordNew.length < 6) {
      setPasswordErr("New password should be at least 6 characters.");
      return;
    }

    if (passwordNew !== passwordConfirm) {
      setPasswordErr("New passwords do not match.");
      return;
    }

    try {
      setPasswordBusy(true);
      await updateAccountPassword(authUser, passwordCurrent, passwordNew);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
      await refreshProfile();
      Alert.alert("Success", "Your password was updated.");
    } catch (e) {
      setPasswordErr(getAuthErrorMessage(e));
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOutUser();
      router.replace("/");
    } catch (e) {
      Alert.alert("Error", getAuthErrorMessage(e));
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <ScreenContainer backgroundColor="#F1F6F5" contentStyle={styles.content}>
      <ScreenHeader
        title="Account"
        showBackButton
        right={
          <HeaderActionButton
            iconName="settings"
            onPress={() => router.push("/(tabs)/settings")}
          />
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainStack}>
            <View style={styles.heroAvatarWrap}>
              <Text style={styles.heroAvatar}>{selectedProfileIcon.emoji}</Text>
            </View>

            <View style={styles.starPill}>
              <Text style={styles.starPillText}>⭐ {stars} Stars</Text>
            </View>

            <SectionCard style={styles.blockCard}>
              <Text style={styles.blockTitle}>Profile Customization</Text>
              <Text style={styles.fieldHint}>
                Earn stars from lessons to unlock new profile icons.
              </Text>

              <Pressable
                style={styles.primaryBtn}
                onPress={() => router.push("/account/edit-profile")}
              >
                <Text style={styles.primaryBtnText}>
                  Unlock & Choose Profile Icon
                </Text>
              </Pressable>

              <Pressable
                style={[styles.primaryBtn, styles.secondaryActionBtn]}
                onPress={() => router.push("/account/achievements")}
              >
                <Text style={styles.primaryBtnText}>View Achievements</Text>
              </Pressable>
            </SectionCard>

            <SectionCard style={styles.blockCard}>
              <Text style={styles.blockTitle}>Your Progress</Text>
              <View style={styles.progressRow}>
                <View style={[styles.progressCard, styles.progressStreak]}>
                  <Text style={styles.progressValue}>{dayStreak}</Text>
                  <Text style={styles.progressLabel}>Day Streak</Text>
                  <Text style={styles.progressEmoji}>🔥</Text>
                </View>

                <View style={[styles.progressCard, styles.progressStars]}>
                  <Text style={styles.progressValue}>{stars}</Text>
                  <Text style={styles.progressLabel}>Stars ⭐</Text>
                </View>
              </View>
            </SectionCard>

            <SectionCard style={styles.blockCard}>
              <Text style={styles.blockTitle}>Display name</Text>
              <Text style={styles.fieldHint}>
                Shown across the app and saved to your profile.
              </Text>

              <TextInput
                value={usernameDraft}
                onChangeText={(t) => {
                  setUsernameDraft(t);
                  if (usernameErr) setUsernameErr("");
                }}
                placeholder="Your name"
                placeholderTextColor="#8CA4A7"
                style={styles.textInput}
                autoCapitalize="words"
                editable={!!authUser && !usernameBusy}
              />

              {usernameErr ? (
                <Text style={styles.fieldError}>{usernameErr}</Text>
              ) : null}

              <Pressable
                style={[
                  styles.primaryBtn,
                  (!authUser || usernameBusy) && styles.btnDisabled,
                ]}
                onPress={() => void handleSaveUsername()}
                disabled={!authUser || usernameBusy}
              >
                {usernameBusy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save name</Text>
                )}
              </Pressable>
            </SectionCard>

            <SectionCard style={styles.blockCard}>
              <Text style={styles.blockTitle}>Email</Text>
              {canChangeEmailPassword ? (
                <>
                  <Text style={styles.fieldHint}>
                    Changing email requires your current password.
                  </Text>

                  <TextInput
                    value={newEmail}
                    onChangeText={(t) => {
                      setNewEmail(t);
                      if (emailErr) setEmailErr("");
                    }}
                    placeholder="you@example.com"
                    placeholderTextColor="#8CA4A7"
                    style={styles.textInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    editable={!!authUser && !emailBusy}
                  />

                  <TextInput
                    value={emailCurrentPassword}
                    onChangeText={(t) => {
                      setEmailCurrentPassword(t);
                      if (emailErr) setEmailErr("");
                    }}
                    placeholder="Current password"
                    placeholderTextColor="#8CA4A7"
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!!authUser && !emailBusy}
                  />

                  {emailErr ? (
                    <Text style={styles.fieldError}>{emailErr}</Text>
                  ) : null}

                  <Pressable
                    style={[
                      styles.primaryBtn,
                      (!authUser || emailBusy) && styles.btnDisabled,
                    ]}
                    onPress={() => void handleSaveEmail()}
                    disabled={!authUser || emailBusy}
                  >
                    {emailBusy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Update email</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text style={styles.fieldHintMuted}>
                  You signed in without an email password. Manage email in your
                  Google (or other) account settings, or contact support to link
                  a password.
                </Text>
              )}
            </SectionCard>

            <SectionCard style={styles.blockCard}>
              <Text style={styles.blockTitle}>Password</Text>
              {canChangeEmailPassword ? (
                <>
                  <Text style={styles.fieldHint}>
                    Use at least 6 characters.
                  </Text>

                  <TextInput
                    value={passwordCurrent}
                    onChangeText={(t) => {
                      setPasswordCurrent(t);
                      if (passwordErr) setPasswordErr("");
                    }}
                    placeholder="Current password"
                    placeholderTextColor="#8CA4A7"
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="current-password"
                    textContentType="password"
                    editable={!!authUser && !passwordBusy}
                  />

                  <TextInput
                    value={passwordNew}
                    onChangeText={(t) => {
                      setPasswordNew(t);
                      if (passwordErr) setPasswordErr("");
                    }}
                    placeholder="New password"
                    placeholderTextColor="#8CA4A7"
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!!authUser && !passwordBusy}
                  />

                  <TextInput
                    value={passwordConfirm}
                    onChangeText={(t) => {
                      setPasswordConfirm(t);
                      if (passwordErr) setPasswordErr("");
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor="#8CA4A7"
                    style={styles.textInput}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="password-new"
                    textContentType="newPassword"
                    editable={!!authUser && !passwordBusy}
                  />

                  {passwordErr ? (
                    <Text style={styles.fieldError}>{passwordErr}</Text>
                  ) : null}

                  <Pressable
                    style={[
                      styles.primaryBtn,
                      (!authUser || passwordBusy) && styles.btnDisabled,
                    ]}
                    onPress={() => void handleSavePassword()}
                    disabled={!authUser || passwordBusy}
                  >
                    {passwordBusy ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Update password</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <Text style={styles.fieldHintMuted}>
                  Password changes apply to email sign-in only. OAuth accounts
                  use the provider&apos;s password or security settings.
                </Text>
              )}
            </SectionCard>

            <Pressable
              style={[styles.signOutBtn, signingOut && styles.btnDisabled]}
              onPress={() => void handleSignOut()}
              disabled={signingOut}
            >
              {signingOut ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons
                    name="logout"
                    size={moderateScale(18) * density}
                    color="#FFFFFF"
                  />
                  <Text style={styles.signOutText}>Logout</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    content: {
      flex: 1,
    },

    keyboardAvoid: {
      flex: 1,
    },

    scrollView: {
      flex: 1,
    },

    scrollContent: {
      flexGrow: 1,
    },

    mainStack: {
      paddingTop: ms(20),
      paddingBottom: ms(16),
      gap: ms(7),
    },

    heroAvatarWrap: {
      width: ms(68),
      height: ms(68),
      borderRadius: ms(34),
      backgroundColor: "#E6DDF0",
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
    },

    heroAvatar: {
      fontSize: ts(34),
      lineHeight: ts(38),
    },

    starPill: {
      backgroundColor: "#E9DEC1",
      borderRadius: ms(12),
      paddingHorizontal: ms(12),
      paddingVertical: ms(4),
      alignSelf: "center",
    },

    starPillText: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      fontSize: ts(12),
      lineHeight: ts(16),
    },

    blockCard: {
      backgroundColor: "#FFFFFF",
      borderRadius: ms(20),
      paddingHorizontal: ms(16),
      paddingVertical: ms(14),
      marginBottom: 0,
    },

    blockTitle: {
      ...Typography.sectionTitle,
      color: semanticColors.text.secondary,
      fontSize: ts(15),
      lineHeight: ts(20),
      textAlign: "center",
      marginBottom: ms(7),
    },

    progressRow: {
      flexDirection: "row",
      gap: ms(8),
    },

    progressCard: {
      flex: 1,
      minHeight: ms(92),
      borderRadius: ms(16),
      paddingVertical: ms(12),
      alignItems: "center",
      justifyContent: "center",
    },

    progressStreak: {
      backgroundColor: "#CADBDD",
    },

    progressStars: {
      backgroundColor: "#DDD4E8",
    },

    progressValue: {
      ...Typography.statNumber,
      fontSize: ts(18),
      lineHeight: ts(20),
      color: "#5BAFB0",
    },

    progressLabel: {
      ...Typography.body,
      color: semanticColors.text.secondary,
      fontSize: ts(12),
      lineHeight: ts(16),
    },

    progressEmoji: {
      fontSize: ts(11),
      lineHeight: ts(14),
      marginTop: ms(3),
    },

    fieldHint: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      fontSize: ts(11),
      lineHeight: ts(15),
      textAlign: "center",
      marginBottom: ms(8),
      opacity: 0.9,
    },

    fieldHintMuted: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      fontSize: ts(12),
      textAlign: "center",
      lineHeight: ts(17),
      paddingVertical: ms(4),
    },

    textInput: {
      width: "100%",
      minHeight: ms(42),
      borderRadius: ms(14),
      backgroundColor: "#E9F0EF",
      paddingHorizontal: ms(14),
      paddingVertical: ms(10),
      fontSize: ts(14),
      lineHeight: ts(18),
      color: semanticColors.text.primary,
      marginBottom: ms(8),
    },

    fieldError: {
      ...Typography.caption,
      color: "#C53030",
      fontSize: ts(12),
      lineHeight: ts(16),
      textAlign: "center",
      marginBottom: ms(8),
    },

    primaryBtn: {
      marginTop: ms(4),
      height: ms(44),
      borderRadius: ms(16),
      backgroundColor: "#43B3A8",
      alignItems: "center",
      justifyContent: "center",
    },

    secondaryActionBtn: {
      marginTop: ms(10),
      backgroundColor: "#5C6AC4",
    },

    btnDisabled: {
      opacity: 0.55,
    },

    primaryBtnText: {
      ...Typography.button,
      fontSize: ts(15),
      lineHeight: ts(19),
      color: "#FFFFFF",
      textAlign: "center",
    },

    signOutBtn: {
      width: "100%",
      marginTop: ms(8),
      marginBottom: ms(8),
      height: ms(47),
      borderRadius: ms(19),
      backgroundColor: "#E55555",
      flexDirection: "row",
      gap: ms(8),
      alignItems: "center",
      justifyContent: "center",
    },

    signOutText: {
      ...Typography.button,
      fontSize: ts(16),
      lineHeight: ts(20),
      color: "#FFFFFF",
    },
  });
};