import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { Spacing, fontWeight } from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { submitFeedback } from "@/src/services/firebase/feedback.service";
import { GradientBackground, GlassCard } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";

const FEEDBACK_CATEGORIES = ["Bug", "Suggestion", "Improvement", "Other"] as const;
type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export default function FeedbackScreen() {
  const [feedback, setFeedback] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FeedbackCategory>("Bug");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const { textScale } = useAccessibility();
  const styles = createStyles(density, textScale);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to attach media."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset) return;

    setSelectedImageUri(asset.uri);
    setSelectedImageName(asset.fileName ?? "Attached image");
  };

  const handleRemoveImage = () => {
    setSelectedImageUri("");
    setSelectedImageName("");
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!feedback.trim()) {
      Alert.alert("Missing feedback", "Please type your feedback first.");
      return;
    }

    try {
      setSubmitting(true);
      await submitFeedback({
        category: selectedCategory,
        message: feedback,
        imageUri: selectedImageUri || undefined,
      });

      Alert.alert(
        "Thank you!",
        `Your ${selectedCategory.toLowerCase()} feedback was submitted${selectedImageUri ? " with your image attached." : "."}`
      );

      setFeedback("");
      setSelectedCategory("Bug");
      setSelectedImageName("");
      setSelectedImageUri("");
    } catch (error) {
      console.warn("Feedback submit failed", error);
      Alert.alert(
        "Error",
        "We couldn't submit your feedback right now. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
    <ScreenContainer
      backgroundColor="transparent"
      safeStyle={{ backgroundColor: "transparent" }}
      contentPadded={false}
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
        >
          <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Feedback</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <GlassCard style={styles.infoCard}>
            <View style={styles.iconWrap}>
              <MaterialIcons
                name="chat-bubble-outline"
                size={28}
                color="#F0A892"
              />
            </View>

            <Text style={styles.infoText}>
              Please leave us any and all feedback so we can better make this
              app in better supporting our community!
            </Text>
          </GlassCard>

          <GlassCard style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Feedback Type</Text>
            <View style={styles.categoryWrap}>
              {FEEDBACK_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category;

                return (
                  <Pressable
                    key={category}
                    style={[
                      styles.categoryPill,
                      isSelected && styles.categoryPillSelected,
                    ]}
                    onPress={() => setSelectedCategory(category)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextSelected,
                      ]}
                    >
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>

          <GlassCard style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Details</Text>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Type any information..."
              placeholderTextColor="#8B9098"
              multiline
              textAlignVertical="top"
              style={styles.feedbackInput}
            />
          </GlassCard>

          <GlassCard style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Attach Media</Text>

            <View style={styles.mediaRow}>
              <Pressable style={styles.attachButton} onPress={handlePickImage}>
                <MaterialIcons name="attach-file" size={18} color="#FFFFFF" />
                <Text style={styles.attachButtonText}>Add Image</Text>
              </Pressable>

              {selectedImageUri ? (
                <Pressable
                  style={styles.removeMediaButton}
                  onPress={handleRemoveImage}
                >
                  <Text style={styles.removeMediaText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.mediaHint}>
              {selectedImageName
                ? `Attached: ${selectedImageName}`
                : "No media attached yet."}
            </Text>
          </GlassCard>

          <View style={styles.buttonRow}>
            <Pressable
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit!</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
    </GradientBackground>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    keyboardWrap: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.screenPadding,
      minHeight: ms(52),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: asl.glass.border,
      backgroundColor: "rgba(8,2,10,0.2)",
    },
    headerBtn: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: asl.text.primary,
      fontSize: ts(20),
      lineHeight: ts(26),
      fontWeight: fontWeight.emphasis,
    },
    headerSpacer: {
      width: ms(40),
      height: ms(40),
    },

    scrollContent: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(16),
      paddingBottom: ms(40),
    },

    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: ms(16),
      paddingHorizontal: ms(16),
      paddingVertical: ms(14),
      marginBottom: ms(18),
      gap: ms(14),
    },

    iconWrap: {
      width: ms(44),
      height: ms(44),
      backgroundColor: "#F6DDD4",
      alignItems: "center",
      justifyContent: "center",
    },

    infoText: {
      flex: 1,
      fontSize: ts(15),
      lineHeight: ts(20),
      fontWeight: "700",
      color: asl.text.primary,
      textAlign: "center",
    },

    sectionBlock: {
      marginBottom: ms(16),
      borderRadius: ms(16),
      padding: ms(14),
    },

    sectionTitle: {
      fontSize: ts(15),
      lineHeight: ts(19),
      fontWeight: "800",
      color: asl.text.primary,
      marginBottom: ms(10),
    },

    categoryWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: ms(10),
    },

    categoryPill: {
      paddingHorizontal: ms(14),
      paddingVertical: ms(10),
      borderRadius: ms(14),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
    },

    categoryPillSelected: {
      backgroundColor: "#F5B9A3",
      borderColor: "#F5B9A3",
    },

    categoryText: {
      fontSize: ts(14),
      lineHeight: ts(18),
      fontWeight: "700",
      color: asl.text.primary,
    },

    categoryTextSelected: {
      color: "#FFFFFF",
    },

    feedbackInput: {
      minHeight: ms(260),
      borderWidth: 1,
      borderColor: asl.glass.border,
      borderRadius: ms(14),
      backgroundColor: "rgba(255,255,255,0.06)",
      paddingHorizontal: ms(12),
      paddingVertical: ms(10),
      fontSize: ts(15),
      lineHeight: ts(20),
      color: asl.text.primary,
    },

    mediaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: ms(10),
      marginBottom: ms(8),
    },

    attachButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: ms(6),
      backgroundColor: "#59B5A7",
      borderRadius: ms(8),
      paddingHorizontal: ms(14),
      paddingVertical: ms(10),
    },

    attachButtonText: {
      color: "#FFFFFF",
      fontSize: ts(14),
      lineHeight: ts(18),
      fontWeight: "700",
    },

    removeMediaButton: {
      backgroundColor: "rgba(232, 213, 206, 0.2)",
      borderRadius: ms(8),
      paddingHorizontal: ms(12),
      paddingVertical: ms(10),
      borderWidth: 1,
      borderColor: asl.glass.border,
    },

    removeMediaText: {
      color: "#6A4E45",
      fontSize: ts(13),
      lineHeight: ts(17),
      fontWeight: "700",
    },

    mediaHint: {
      fontSize: ts(13),
      lineHeight: ts(17),
      color: asl.text.secondary,
    },

    buttonRow: {
      marginTop: ms(6),
    },

    submitButton: {
      width: "100%",
      minHeight: ms(52),
      backgroundColor: "#43B3A8",
      borderRadius: ms(14),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(16),
    },

    submitButtonDisabled: {
      opacity: 0.7,
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: ts(16),
      lineHeight: ts(20),
      fontWeight: "700",
    },
  });
};