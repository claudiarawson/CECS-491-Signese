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
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";
import { submitFeedback } from "@/src/services/firebase/feedback.service";

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
    <ScreenContainer backgroundColor="#E9EEEC">
      <ScreenHeader title="Feedback" showBackButton />

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoCard}>
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
          </View>

          <View style={styles.sectionBlock}>
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
          </View>

          <View style={styles.sectionBlock}>
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
          </View>

          <View style={styles.sectionBlock}>
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
          </View>

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
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    keyboardWrap: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal: ms(24),
      paddingTop: ms(10),
      paddingBottom: ms(24),
    },

    infoCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D8E1E8",
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
      color: "#111111",
      textAlign: "center",
    },

    sectionBlock: {
      marginBottom: ms(16),
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D8E1E8",
      borderRadius: ms(16),
      padding: ms(14),
    },

    sectionTitle: {
      fontSize: ts(15),
      lineHeight: ts(19),
      fontWeight: "800",
      color: "#222222",
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
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D8E1E8",
    },

    categoryPillSelected: {
      backgroundColor: "#F5B9A3",
      borderColor: "#F5B9A3",
    },

    categoryText: {
      fontSize: ts(14),
      lineHeight: ts(18),
      fontWeight: "700",
      color: "#444444",
    },

    categoryTextSelected: {
      color: "#FFFFFF",
    },

    feedbackInput: {
      minHeight: ms(260),
      borderWidth: 1,
      borderColor: "#D8E1E8",
      borderRadius: ms(14),
      backgroundColor: "#F8FBFA",
      paddingHorizontal: ms(12),
      paddingVertical: ms(10),
      fontSize: ts(15),
      lineHeight: ts(20),
      color: "#111111",
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
      backgroundColor: "#E8D5CE",
      borderRadius: ms(8),
      paddingHorizontal: ms(12),
      paddingVertical: ms(10),
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
      color: "#5F6770",
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