import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { semanticColors, Spacing, Typography } from "@/src/theme";
import { ScreenContainer, ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout";

function CommonResponsesPlaceholder() {
  const items = useMemo(() => ["Good", "Ok", "Bad"], []);

  return (
    <View style={styles.responsesPanel}>
      <Text style={styles.responsesTitle}>Common Responses</Text>
      {items.map((item) => (
        <View key={item} style={styles.responseItem}>
          <MaterialIcons name="image" size={16} color="#6C7A89" />
          <Text style={styles.responseText}>{item}</Text>
        </View>
      ))}
      <Text style={styles.responsesHint}>Suggested signs/GIFs</Text>
    </View>
  );
}

export default function TranslateScreen() {
  const [cameraActive, setCameraActive] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleActivateCamera = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        return;
      }
    }

    setCameraActive(true);
  };

  const handleToggleCamera = async () => {
    if (cameraActive) {
      setCameraActive(false);
      return;
    }

    await handleActivateCamera();
  };

  const permissionDenied = permission && !permission.granted;

  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Translate"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings")}
            />
            <HeaderAvatarButton onPress={() => router.push("/(tabs)/account")} />
          </>
        }
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Pressable style={styles.videoCard} onPress={handleActivateCamera}>
            {cameraActive && permission?.granted ? (
              <>
                <CameraView style={styles.cameraPreview} facing="front" />
                <Pressable style={styles.cameraToggleChip} onPress={handleToggleCamera}>
                  <MaterialIcons name="videocam-off" size={14} color="#FFFFFF" />
                </Pressable>
              </>
            ) : (
              <View style={styles.videoPlaceholderWrap}>
                <MaterialIcons name="videocam" size={34} color="#608D86" />
                <Text style={styles.videoPlaceholderTitle}>Tap to open camera</Text>
                <Text style={styles.videoPlaceholderSubtitle}>
                  {permissionDenied
                    ? "Camera permission is needed to start live preview."
                    : "Live translation preview will appear here."}
                </Text>
              </View>
            )}
          </Pressable>

          <CommonResponsesPlaceholder />
        </View>

        <View style={styles.captionsControlsRow}>
          <Pressable style={styles.smallControlBtn} onPress={handleToggleCamera}>
            <MaterialIcons
              name={cameraActive ? "videocam-off" : "videocam"}
              size={18}
              color="#2C5D56"
            />
          </Pressable>
          <Text style={styles.captionsLabel}>Captions</Text>
          <Pressable style={styles.smallControlBtn}>
            <MaterialIcons name="volume-up" size={18} color="#2C5D56" />
          </Pressable>
        </View>

        <View style={styles.captionsCard}>
          <Text style={styles.captionsPlaceholderText}>Translation output will appear here.</Text>
          <Text style={styles.captionsSubText}>
            {cameraActive
              ? "Waiting for live translation..."
              : "Camera is off. Live translation is paused."}
          </Text>
        </View>
      </View>

      {/* TODO: connect camera stream to live translation repository pipeline (only when cameraActive is true). */}
      {/* TODO: bind captions content to translation output once backend integration is available. */}
      {/* TODO: replace Common Responses placeholders with dictionary-driven response suggestions. */}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingBottom: Spacing.md,
  },
  topSection: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  videoCard: {
    flex: 1,
    minHeight: 250,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#D9ECE8",
    borderWidth: 1,
    borderColor: "#C6DEDA",
  },
  cameraPreview: {
    flex: 1,
  },
  cameraToggleChip: {
    position: "absolute",
    top: 10,
    right: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  videoPlaceholderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.md,
  },
  videoPlaceholderTitle: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  videoPlaceholderSubtitle: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: 6,
    textAlign: "center",
  },
  responsesPanel: {
    width: 120,
    minHeight: 250,
    borderRadius: 18,
    backgroundColor: "#EDF5F3",
    borderWidth: 1,
    borderColor: "#D8E8E4",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  responsesTitle: {
    ...Typography.caption,
    fontWeight: "700",
    color: semanticColors.text.primary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  responseItem: {
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D5E6E3",
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
    paddingVertical: 6,
    gap: 4,
  },
  responseText: {
    ...Typography.caption,
    color: semanticColors.text.primary,
    fontWeight: "600",
  },
  responsesHint: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: 10,
  },
  captionsControlsRow: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallControlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E2F0ED",
    borderWidth: 1,
    borderColor: "#C9E1DC",
    alignItems: "center",
    justifyContent: "center",
  },
  captionsLabel: {
    ...Typography.sectionTitle,
    color: semanticColors.text.primary,
  },
  captionsCard: {
    marginTop: Spacing.sm,
    flex: 1,
    minHeight: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#C8DDDA",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
  },
  captionsPlaceholderText: {
    ...Typography.body,
    color: semanticColors.text.primary,
    fontSize: 16,
  },
  captionsSubText: {
    ...Typography.caption,
    color: semanticColors.text.secondary,
    marginTop: Spacing.xs,
  },
});
