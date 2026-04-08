import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { Spacing, getDeviceDensity, moderateScale } from "@/src/theme";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import {
  CommunitySignSubmitError,
  submitCommunitySign,
} from "@/src/services/dictionary/communitySignSubmit";

const TEAL = "#48B4A8";
const TEAL_DARK = "#2c9a8f";
const MINT = "#BFE4DF";
const BG = "#F4FBFA";
const TEXT = "#0B0B0B";
const GRAY_MEDIA = "#D9D9D9";

export default function AddSignScreen() {
  const { authUser } = useAuthUser();
  const { textScale } = useAccessibility();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  /** Same as in `createStyles` — used for dynamic bottom padding with safe area. */
  const ms = (value: number) => moderateScale(value) * density;
  const styles = createStyles(density, textScale);

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

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="Add Sign" showBackButton onBackPress={() => router.back()} />

      <View style={styles.body}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {!authUser ? (
          <Text style={styles.warn}>
            Sign in to submit a community sign.{" "}
            <Text style={styles.warnLink} onPress={() => router.push("/(auth)/login")}>
              Go to login
            </Text>
          </Text>
        ) : null}

        <View style={styles.row}>
          <TextInput
            style={styles.wordInput}
            value={word}
            onChangeText={setWord}
            placeholder="Word / sign *"
            placeholderTextColor="#999"
            editable={!submitting}
          />
          <Pressable
            style={[styles.mediaButton, submitting && styles.mediaButtonDisabled]}
            onPress={pickVideo}
            disabled={submitting}
          >
            <Text style={styles.mediaButtonText}>🎬</Text>
            <Text style={styles.mediaButtonLabel} numberOfLines={2}>
              {videoUri ? "Change video" : "add video *"}
            </Text>
          </Pressable>
        </View>

        {videoLabel ? (
          <Text style={styles.videoHint} numberOfLines={1}>
            {videoLabel}
          </Text>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Definition *</Text>
          <TextInput
            style={styles.textarea}
            value={definition}
            onChangeText={setDefinition}
            placeholder="Enter definition"
            placeholderTextColor="#999"
            multiline
            editable={!submitting}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>How to Sign *</Text>
          <TextInput
            style={styles.textarea}
            value={howToSign}
            onChangeText={setHowToSign}
            placeholder="Enter instructions"
            placeholderTextColor="#999"
            multiline
            editable={!submitting}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Note (optional)</Text>
          <TextInput
            style={styles.textarea}
            value={note}
            onChangeText={setNote}
            placeholder="Add optional note"
            placeholderTextColor="#999"
            multiline
            editable={!submitting}
          />
        </View>

        {submitting && uploadProgress != null ? (
          <Text style={styles.progressText}>
            Uploading… {Math.round(Math.min(1, Math.max(0, uploadProgress)) * 100)}%
          </Text>
        ) : submitting ? (
          <Text style={styles.progressText}>Submitting…</Text>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomRow, { paddingBottom: Math.max(ms(24), insets.bottom + ms(8)) }]}>
        <Pressable
          style={[styles.backButton, submitting && styles.btnDisabled]}
          onPress={() => router.back()}
          disabled={submitting}
        >
          <Text style={styles.backButtonText}>« Back</Text>
        </Pressable>
        <Pressable
          style={[styles.submitButton, (submitDisabled || submitting) && styles.btnDisabled]}
          onPress={() => void handleSubmit()}
          disabled={submitDisabled || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </Pressable>
      </View>
      </View>
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    body: {
      flex: 1,
      minHeight: 0,
      backgroundColor: BG,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: ms(12),
      paddingBottom: ms(24),
    },
    warn: {
      color: "#856404",
      backgroundColor: "#fff3cd",
      padding: ms(12),
      borderRadius: ms(12),
      marginBottom: ms(12),
      fontSize: ts(14),
      lineHeight: ts(18),
    },
    warnLink: {
      color: TEAL_DARK,
      fontWeight: "700",
    },
    row: {
      flexDirection: "row",
      gap: ms(12),
      marginBottom: ms(8),
      alignItems: "flex-start",
    },
    wordInput: {
      flex: 1,
      backgroundColor: MINT,
      borderRadius: ms(16),
      paddingHorizontal: ms(12),
      paddingVertical: ms(12),
      fontSize: ts(16),
      lineHeight: ts(20),
      color: TEXT,
    },
    mediaButton: {
      width: ms(100),
      height: ms(100),
      backgroundColor: GRAY_MEDIA,
      borderRadius: ms(16),
      borderWidth: 3,
      borderColor: TEAL,
      justifyContent: "center",
      alignItems: "center",
    },
    mediaButtonDisabled: {
      opacity: 0.6,
    },
    mediaButtonText: {
      fontSize: ts(28),
    },
    mediaButtonLabel: {
      fontSize: ts(10),
      marginTop: ms(4),
      color: TEXT,
      fontWeight: "600",
      textAlign: "center",
      paddingHorizontal: ms(4),
    },
    videoHint: {
      fontSize: ts(12),
      color: "#566",
      marginBottom: ms(16),
    },
    section: {
      marginBottom: ms(20),
    },
    sectionLabel: {
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
      color: TEXT,
      textAlign: "center",
      marginBottom: ms(8),
    },
    textarea: {
      backgroundColor: MINT,
      borderRadius: ms(16),
      paddingHorizontal: ms(12),
      paddingVertical: ms(12),
      fontSize: ts(16),
      lineHeight: ts(22),
      color: TEXT,
      minHeight: ms(100),
      textAlignVertical: "top",
    },
    progressText: {
      textAlign: "center",
      color: TEAL_DARK,
      fontWeight: "600",
      marginTop: ms(8),
      fontSize: ts(14),
    },
    bottomRow: {
      flexShrink: 0,
      flexDirection: "row",
      gap: ms(12),
      paddingHorizontal: Spacing.xl,
      paddingTop: ms(16),
      backgroundColor: BG,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: "#ddd",
    },
    backButton: {
      flex: 1,
      backgroundColor: TEAL,
      borderRadius: ms(16),
      paddingVertical: ms(14),
      alignItems: "center",
      justifyContent: "center",
    },
    backButtonText: {
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
      color: "white",
    },
    submitButton: {
      flex: 1,
      backgroundColor: TEAL,
      borderRadius: ms(16),
      paddingVertical: ms(14),
      alignItems: "center",
      justifyContent: "center",
      minHeight: ms(48),
    },
    submitButtonText: {
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
      color: "white",
    },
    btnDisabled: {
      opacity: 0.55,
    },
  });
};
