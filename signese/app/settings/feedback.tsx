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
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer, ScreenHeader } from "@/src/components/layout";
import { getDeviceDensity, moderateScale } from "@/src/theme";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

const FEEDBACK_CATEGORIES = ["Bug", "Suggestion", "Improvement", "Other"] as const;
type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export default function FeedbackScreen() {
  const [feedback, setFeedback] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState<FeedbackCategory>("Bug");
  const [selectedImageName, setSelectedImageName] = useState("");
  const [selectedImageUri, setSelectedImageUri] = useState("");

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

  const handleSubmit = () => {
    if (!feedback.trim()) {
      Alert.alert("Missing feedback", "Please type your feedback first.");
      return;
    }

    Alert.alert(
      "Submitted",
      `Category: ${selectedCategory}\nMedia attached: ${selectedImageUri ? "Yes" : "No"}`
    );

    setFeedback("");
    setSelectedCategory("Bug");
    setSelectedImageName("");
    setSelectedImageUri("");
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
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>&lt;&lt; Back</Text>
            </Pressable>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Submit!</Text>
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
      backgroundColor: "#F7F7F7",
      borderWidth: 1,
      borderColor: "#D8DDD9",
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
      borderRadius: ms(20),
      backgroundColor: "#F7F7F7",
      borderWidth: 1.5,
      borderColor: "#CFCFCF",
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
      borderWidth: ms(2),
      borderColor: "#232323",
      borderRadius: ms(6),
      backgroundColor: "#DCE8F4",
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
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: ms(14),
      marginTop: ms(8),
    },

    backButton: {
      alignSelf: "flex-start",
      backgroundColor: "#59B5A7",
      borderRadius: ms(6),
      paddingHorizontal: ms(12),
      paddingVertical: ms(8),
    },

    backButtonText: {
      color: "#FFFFFF",
      fontSize: ts(14),
      lineHeight: ts(18),
      fontWeight: "700",
    },

    submitButton: {
      flex: 1,
      maxWidth: ms(192),
      minHeight: ms(88),
      backgroundColor: "#F5B9A3",
      borderRadius: ms(6),
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(16),
    },

    submitButtonText: {
      color: "#FFFFFF",
      fontSize: ts(25),
      lineHeight: ts(30),
      fontWeight: "800",
    },
  });
};