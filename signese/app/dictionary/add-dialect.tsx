import { AppShell, GlassCard, InputField } from "@/src/components/asl";
import { Spacing, fontFamily, getDeviceDensity, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useCallback, useState } from "react";
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
import {
  CommunitySignSubmitError,
  submitCommunitySign,
} from "@/src/services/dictionary/communitySignSubmit";

export default function AddSignScreen() {
  const { authUser } = useAuthUser();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const ms = (value: number) => moderateScale(value) * density;
  const styles = createStyles(density);

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
            onPress: () => router.replace("/(tabs)/dictionary"),
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

  const header = (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.headerIconBtn, pressed && { opacity: 0.7 }]}
      >
        <MaterialIcons name="arrow-back" size={24} color={asl.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle} numberOfLines={1}>
        Add sign
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const bottomPad = Math.max(insets.bottom, ms(12)) + ms(92);

  return (
    <AppShell scroll={false} header={header}>
      <View style={styles.fill}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPad }]}
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
                <MaterialIcons name="videocam" size={ms(32)} color={asl.accentCyan} />
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

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, ms(12)) }]}>
          <Pressable
            style={[styles.backButton, submitting && styles.btnDisabled]}
            onPress={() => router.back()}
            disabled={submitting}
            accessibilityRole="button"
          >
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
          <Pressable
            style={[styles.submitWrap, (submitDisabled || submitting) && styles.btnDisabled]}
            onPress={() => void handleSubmit()}
            disabled={submitDisabled || submitting}
          >
            <LinearGradient
              colors={[...asl.primaryButton] as unknown as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitGradient}
            >
              {submitting ? (
                <ActivityIndicator color={asl.surfaceLight} />
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

const createStyles = (density: number) => {
  const ms = (value: number) => moderateScale(value) * density;
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
      color: asl.text.primary,
      fontSize: ms(22),
      fontFamily: fontFamily.heading,
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
      color: asl.text.secondary,
      fontSize: ms(14),
      lineHeight: ms(20),
      fontFamily: fontFamily.body,
    },
    warnLink: {
      color: asl.linkPink,
      fontWeight: "700",
      fontFamily: fontFamily.medium,
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
      color: asl.text.primary,
      fontWeight: "600",
      textAlign: "center",
      fontFamily: fontFamily.medium,
    },
    videoHint: {
      fontSize: ms(12),
      color: asl.text.muted,
      marginBottom: ms(12),
      fontFamily: fontFamily.body,
    },
    textarea: {
      textAlignVertical: "top",
    },
    progressText: {
      textAlign: "center",
      color: asl.accentCyan,
      fontWeight: "600",
      marginTop: ms(8),
      fontSize: ms(14),
      fontFamily: fontFamily.medium,
    },
    footer: {
      flexShrink: 0,
      flexDirection: "row",
      gap: ms(12),
      paddingHorizontal: Spacing.xl - 4,
      paddingTop: ms(14),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    backButton: {
      flex: 1,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(255,255,255,0.08)",
      paddingVertical: ms(14),
      alignItems: "center",
      justifyContent: "center",
      minHeight: ms(48),
    },
    backButtonText: {
      fontSize: ms(16),
      fontFamily: fontFamily.heading,
      color: asl.text.primary,
    },
    submitWrap: {
      flex: 1,
      borderRadius: 999,
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
      fontFamily: fontFamily.heading,
      color: asl.surfaceLight,
    },
    btnDisabled: {
      opacity: 0.55,
    },
  });
};
