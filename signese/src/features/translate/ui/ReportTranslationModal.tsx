import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { AppButton } from "@/src/components/ui";
import { Radius, semanticColors, Spacing, Typography } from "@/src/theme";
import { Surfaces } from "@/src/theme/surfaces";
import {
  submitTranslationReport,
  type TranslationReportPayload,
} from "@/src/services/firebase/translationReport.service";

export type ReportTranslationContext = {
  translationId?: string;
  sourceText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  conversationId?: string;
  sessionId?: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  context: ReportTranslationContext | null;
};

export function ReportTranslationModal({ visible, onClose, context }: Props) {
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setDescription("");
      setError(null);
      setSuccess(false);
      setSubmitting(false);
    }
  }, [visible, context?.translationId, context?.translatedText]);

  const handleSubmit = async () => {
    if (!context) {
      return;
    }
    const trimmed = description.trim();
    if (!trimmed) {
      setError("Please describe the issue before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const payload: TranslationReportPayload = {
      translationId: context.translationId,
      sourceText: context.sourceText,
      translatedText: context.translatedText,
      sourceLanguage: context.sourceLanguage,
      targetLanguage: context.targetLanguage,
      issueDescription: trimmed,
      createdAt: new Date().toISOString(),
      conversationId: context.conversationId,
      sessionId: context.sessionId,
    };

    try {
      await submitTranslationReport(payload);
      setSuccess(true);
      setDescription("");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "We could not submit your report. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
      accessibilityViewIsModal
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.dim} onPress={handleClose} accessibilityLabel="Dismiss report form" />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle} accessibilityRole="header">
              Report incorrect translation
            </Text>
            <Pressable
              onPress={handleClose}
              disabled={submitting}
              style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close report form"
            >
              <MaterialIcons name="close" size={22} color={semanticColors.text.primary} />
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.helper}>
              What was incorrect about this translation? Describe the issue so we can improve future
              translations.
            </Text>

            {context ? (
              <View style={styles.metaBlock}>
                <Text style={styles.metaLabel}>Word</Text>
                <Text style={styles.metaValue} numberOfLines={3}>
                  {context.sourceText || "—"}
                </Text>
              </View>
            ) : null}

            <Text nativeID="reportIssueLabel" style={styles.inputLabel}>
              Your feedback
            </Text>
            <TextInput
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (error) {
                  setError(null);
                }
              }}
              placeholder="What was incorrect about this translation?"
              placeholderTextColor={semanticColors.input.placeholder}
              multiline
              textAlignVertical="top"
              style={styles.textArea}
              editable={!submitting && !success}
              accessibilityLabel="Describe the translation issue"
              accessibilityHint="Required. Explain what was wrong with this translation."
              accessibility-labelledby="reportIssueLabel"
            />

            {error ? (
              <Text style={styles.errorText} accessibilityLiveRegion="polite">
                {error}
              </Text>
            ) : null}
            {success ? (
              <View style={styles.successBanner}>
                <MaterialIcons name="check-circle" size={20} color="#1D6F42" />
                <Text style={styles.successText}>Thanks — your report has been submitted.</Text>
              </View>
            ) : null}
          </ScrollView>

          {!success ? (
            <View style={styles.actions}>
              <AppButton
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting || !context || !description.trim()}
                style={styles.submitBtn}
              >
                Submit report
              </AppButton>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  dim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheet: {
    backgroundColor: Surfaces.card,
    borderTopLeftRadius: Radius.lg,
    borderTopRightRadius: Radius.lg,
    maxHeight: "88%",
    paddingBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Surfaces.hairline,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Surfaces.hairline,
  },
  sheetTitle: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
    fontWeight: "700",
    flex: 1,
    paddingRight: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Surfaces.accentWash,
  },
  closeBtnPressed: {
    opacity: 0.85,
  },
  scrollInner: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  helper: {
    ...Typography.body,
    color: semanticColors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  metaBlock: {
    backgroundColor: Surfaces.cardMuted,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Surfaces.hairline,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaLabel: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  metaSpaced: {
    marginTop: Spacing.sm,
  },
  metaValue: {
    ...Typography.body,
    color: semanticColors.text.primary,
    marginTop: 4,
  },
  inputLabel: {
    ...Typography.caption,
    color: semanticColors.text.primary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  textArea: {
    ...Typography.body,
    minHeight: 120,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: semanticColors.input.border,
    backgroundColor: semanticColors.input.background,
    color: semanticColors.input.text,
    padding: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    color: "#B91C1C",
    fontWeight: "600",
    marginTop: Spacing.sm,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: "#ECFDF3",
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  successText: {
    ...Typography.caption,
    color: "#166534",
    fontWeight: "600",
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Surfaces.hairline,
  },
  submitBtn: {
    flex: 1,
  },
});
