import { AppShell, GlassCard, InputField } from "@/src/components/asl";
import { dictionaryChromeAbsoluteBottom } from "@/src/components/DictionaryFooter";
import { Spacing, fontWeight, getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useTheme, type ThemeColors } from "@/src/contexts/ThemeContext";
import {
  CommunitySignSubmitError,
  submitCommunitySign,
} from "@/src/services/dictionary/communitySignSubmit";

export default function AddSignScreen() {
  const { authUser } = useAuthUser();
  const { colors, theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = (value: number) => moderateScale(value) * density;
  const styles = useMemo(() => createStyles(density, colors, theme), [density, colors, theme]);

  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [howToSign, setHowToSign] = useState("");
  const [note, setNote] = useState("");
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoLabel, setVideoLabel] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const resetForm = useCallback(() => {
    setWord("");
    setDefinition("");
    setHowToSign("");
    setNote("");
    setVideoUri(null);
    setVideoLabel(null);
    setUploadProgress(null);
  }, []);

  const pickVideo = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to choose a sign video.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: 120,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setVideoUri(asset.uri);
    setVideoLabel(asset.fileName ?? "Selected video");
  };

  const handleSubmit = async () => {
    if (!authUser) {
      Alert.alert("Sign in required", "Please sign in to submit a community sign.", [
        { text: "OK", onPress: () => router.push("/(auth)/login") },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    try {
      setSubmitting(true);
      setUploadProgress(0);

      const result = await submitCommunitySign(
        {
          word,
          definition,
          howToSign,
          note,
        },
        videoUri,
        {
          onUploadProgress: (r) => setUploadProgress(r),
        }
      );

      resetForm();
      Alert.alert(
        "Success",
        "Your community sign was saved. It will appear in the dictionary after the list refreshes.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/dictionary"),
          },
        ]
      );
      if (__DEV__) {
        console.log("[AddSign] Created doc", result.docId, "storage:", result.storagePath);
      }
    } catch (e) {
      if (e instanceof CommunitySignSubmitError) {
        Alert.alert("Cannot submit", e.message);
      } else {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert("Error", msg || "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const submitDisabled =
    submitting ||
    !word.trim() ||
    !definition.trim() ||
    !howToSign.trim() ||
    !videoUri;

  const chromeBottom = dictionaryChromeAbsoluteBottom(density, insets.bottom);
  /** Padding above floating tab bar + full-width submit strip so scroll clears both. */
  const submitStripHeight = ms(14) + ms(48) + ms(14);
  const scrollBottomPad = chromeBottom + submitStripHeight + ms(12);

  const header = (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Add sign
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  return (
    <AppShell scroll={false} header={header}>
      <View style={styles.fill}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: scrollBottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {!authUser ? (
            <GlassCard style={styles.warnGlass}>
              <Text style={styles.warnText}>
                Sign in to submit a community sign.{" "}
                <Text style={styles.warnLink} onPress={() => router.push("/(auth)/login")}>
                  Go to login
                </Text>
              </Text>
            </GlassCard>
          ) : null}

          <View style={styles.wordVideoRow}>
            <View style={styles.wordField}>
              <InputField
                label="Word / sign *"
                value={word}
                onChangeText={setWord}
                editable={!submitting}
                placeholder="e.g. Hello"
              />
            </View>
            <GlassCard style={styles.videoCardOuter} contentStyle={styles.videoCardInner}>
              <Pressable
                style={[styles.videoPick, submitting && styles.mediaButtonDisabled]}
                onPress={pickVideo}
                disabled={submitting}
                accessibilityRole="button"
                accessibilityLabel={videoUri ? "Change video" : "Add sign video"}
              >
                <MaterialIcons name="videocam" size={ms(32)} color={colors.accentBlue} />
                <Text style={styles.videoPickLabel} numberOfLines={2}>
                  {videoUri ? "Change video" : "Add video *"}
                </Text>
              </Pressable>
            </GlassCard>
          </View>

          {videoLabel ? (
            <Text style={styles.videoHint} numberOfLines={1}>
              {videoLabel}
            </Text>
          ) : null}

          <InputField
            label="Definition *"
            value={definition}
            onChangeText={setDefinition}
            placeholder="What does this sign mean?"
            multiline
            editable={!submitting}
            style={[styles.textarea, { minHeight: ms(100) }]}
          />
          <InputField
            label="How to sign *"
            value={howToSign}
            onChangeText={setHowToSign}
            placeholder="Handshape, motion, palm orientation…"
            multiline
            editable={!submitting}
            style={[styles.textarea, { minHeight: ms(100) }]}
          />
          <InputField
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Optional context or regional note"
            multiline
            editable={!submitting}
            style={[styles.textarea, { minHeight: ms(80) }]}
          />

          {submitting && uploadProgress != null ? (
            <Text style={styles.progressText}>
              Uploading… {Math.round(Math.min(1, Math.max(0, uploadProgress)) * 100)}%
            </Text>
          ) : submitting ? (
            <Text style={styles.progressText}>Submitting…</Text>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { bottom: chromeBottom }]}>
          <Pressable
            style={[styles.submitWrap, (submitDisabled || submitting) && styles.btnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitDisabled || submitting}
            accessibilityRole="button"
            accessibilityLabel="Submit community sign"
          >
            <LinearGradient
              colors={[...asl.primaryButton] as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </AppShell>
  );
}

const createStyles = (density: number, colors: ThemeColors, theme: "light" | "dark") => {
  const ms = (value: number) => moderateScale(value) * density;
  const footerBg = theme === "light" ? colors.panelMuted : "rgba(0,0,0,0.45)";

  return StyleSheet.create({
    fill: {
      flex: 1,
      minHeight: 0,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.screenPadding,
      paddingBottom: Spacing.sm,
      gap: ms(8),
    },
    headerIconBtn: {
      padding: ms(4),
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: ms(22),
      fontWeight: fontWeight.emphasis,
      textAlign: "center",
    },
    headerSpacer: {
      width: ms(32),
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl - 4,
      paddingTop: ms(8),
    },
    warnGlass: {
      marginBottom: ms(16),
    },
    warnText: {
      color: colors.text,
      fontSize: ms(14),
      lineHeight: ms(20),
    },
    warnLink: {
      color: colors.primary,
      fontWeight: fontWeight.medium,
    },
    wordVideoRow: {
      flexDirection: "row",
      gap: ms(12),
      alignItems: "flex-start",
      marginBottom: ms(8),
    },
    wordField: {
      flex: 1,
      minWidth: 0,
    },
    videoCardOuter: {
      width: ms(108),
    },
    videoCardInner: {
      padding: ms(10),
    },
    videoPick: {
      alignItems: "center",
      justifyContent: "center",
      minHeight: ms(108),
      gap: ms(6),
    },
    mediaButtonDisabled: {
      opacity: 0.55,
    },
    videoPickLabel: {
      fontSize: ms(11),
      color: colors.text,
      textAlign: "center",
      fontWeight: fontWeight.medium,
    },
    videoHint: {
      fontSize: ms(12),
      color: colors.subtext,
      marginBottom: ms(12),
    },
    textarea: {
      textAlignVertical: "top",
    },
    progressText: {
      textAlign: "center",
      color: colors.accentBlue,
      marginTop: ms(8),
      fontSize: ms(14),
      fontWeight: fontWeight.medium,
    },
    footer: {
      position: "absolute",
      left: Spacing.screenPadding,
      right: Spacing.screenPadding,
      flexShrink: 0,
      paddingTop: ms(14),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: footerBg,
    },
    submitWrap: {
      width: "100%",
      borderRadius: ms(18),
      overflow: "hidden",
      minHeight: ms(48),
      ...asl.shadow.card,
    },
    submitGradient: {
      flex: 1,
      minHeight: ms(48),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(16),
    },
    submitButtonText: {
      fontSize: ms(16),
      fontWeight: fontWeight.emphasis,
      color: asl.surfaceLight,
    },
    btnDisabled: {
      opacity: 0.55,
    },
  });
};
