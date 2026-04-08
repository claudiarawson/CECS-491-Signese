import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import {
  semanticColors,
  Spacing,
  Typography,
  getDeviceDensity,
  moderateScale,
} from "@/src/theme";
import {
  ScreenContainer,
  ScreenHeader,
  HeaderActionButton,
  HeaderAvatarButton,
} from "@/src/components/layout";
import { useAuthUser } from "@/src/contexts/AuthUserContext";
import { getProfileIconById } from "@/src/features/account/types";
import { useAccessibility } from "@/src/contexts/AccessibilityContext";

function CommonResponsesPlaceholder({
  styles,
}: {
  styles: ReturnType<typeof createStyles>;
}) {
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
  const { profile } = useAuthUser();
  const { textScale } = useAccessibility();
  const headerProfileIcon = getProfileIconById(profile?.avatar);
  const { width, height } = useWindowDimensions();
  const density = getDeviceDensity(width, height);
  const styles = createStyles(density, textScale);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"front" | "back">("front");
  const [isVolumeOn, setIsVolumeOn] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();

  const handleActivateCamera = async () => {
    if (!permission?.granted) {
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

  const handleReverseCamera = () => {
    if (Platform.OS === "web") {
      return;
    }

    setCameraFacing((previous) => (previous === "front" ? "back" : "front"));
  };

  const handleToggleVolume = () => {
    setIsVolumeOn((previous) => !previous);
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
              onPress={() => router.push("/(tabs)/settings" as any)}
            />
            <HeaderAvatarButton
              avatar={headerProfileIcon.emoji}
              onPress={() => router.push("/(tabs)/account")}
            />
          </>
        }
      />

      <View style={styles.content}>
        <View style={styles.topSection}>
          <Pressable style={styles.videoCard} onPress={handleActivateCamera}>
            {cameraActive && permission?.granted ? (
              <CameraView style={styles.cameraPreview} facing={cameraFacing} />
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

          <CommonResponsesPlaceholder styles={styles} />
        </View>

        <View style={styles.captionsControlsRow}>
          <View style={styles.leftControlsWrap}>
            <Pressable style={styles.smallControlBtn} onPress={handleToggleCamera}>
              <MaterialIcons
                name={cameraActive ? "videocam-off" : "videocam"}
                size={18}
                color="#2C5D56"
              />
            </Pressable>
            {Platform.OS !== "web" ? (
              <Pressable style={styles.smallControlBtn} onPress={handleReverseCamera}>
                <MaterialIcons name="flip-camera-ios" size={18} color="#2C5D56" />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.captionsLabelWrap} pointerEvents="none">
            <Text style={styles.captionsLabel}>Captions</Text>
          </View>

          <View style={styles.rightControlsWrap}>
            <Pressable style={styles.smallControlBtn} onPress={handleToggleVolume}>
              <MaterialIcons
                name={isVolumeOn ? "volume-up" : "volume-off"}
                size={18}
                color="#2C5D56"
              />
            </Pressable>
          </View>
        </View>

        <View style={styles.captionsCard}>
          <Text style={styles.captionsPlaceholderText}>
            Translation output will appear here.
          </Text>
          <Text style={styles.captionsSubText}>
            {cameraActive
              ? "Waiting for live translation..."
              : "Camera is off. Live translation is paused."}
          </Text>
          <Text style={styles.captionsSubText}>
            {isVolumeOn ? "Volume is on." : "Volume is muted."}
          </Text>
        </View>
      </View>

      {/* TODO: connect camera stream to live translation repository pipeline (only when cameraActive is true). */}
      {/* TODO: bind captions content to translation output once backend integration is available. */}
      {/* TODO: replace Common Responses placeholders with dictionary-driven response suggestions. */}
    </ScreenContainer>
  );
}

const createStyles = (density: number, textScale: number) => {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
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
      minHeight: ms(250),
      borderRadius: ms(20),
      overflow: "hidden",
      backgroundColor: "#D9ECE8",
      borderWidth: 1,
      borderColor: "#C6DEDA",
    },
    cameraPreview: {
      flex: 1,
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
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    videoPlaceholderSubtitle: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      marginTop: ms(6),
      textAlign: "center",
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    responsesPanel: {
      width: ms(120),
      minHeight: ms(250),
      borderRadius: ms(18),
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
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    responseItem: {
      borderRadius: ms(12),
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#D5E6E3",
      minHeight: ms(52),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
      paddingVertical: ms(6),
      gap: ms(4),
    },
    responseText: {
      ...Typography.caption,
      color: semanticColors.text.primary,
      fontWeight: "600",
      fontSize: ts(12),
      lineHeight: ts(16),
    },
    responsesHint: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      textAlign: "center",
      marginTop: Spacing.xs,
      fontSize: ts(10),
      lineHeight: ts(13),
    },
    captionsControlsRow: {
      marginTop: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      position: "relative",
    },
    leftControlsWrap: {
      width: ms(84),
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    rightControlsWrap: {
      width: ms(84),
      alignItems: "flex-end",
    },
    captionsLabelWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      alignItems: "center",
    },
    smallControlBtn: {
      width: ms(36),
      height: ms(36),
      borderRadius: ms(18),
      backgroundColor: "#E2F0ED",
      borderWidth: 1,
      borderColor: "#C9E1DC",
      alignItems: "center",
      justifyContent: "center",
    },
    captionsLabel: {
      ...Typography.sectionTitle,
      color: semanticColors.text.primary,
      fontSize: ts(18),
      lineHeight: ts(22),
    },
    captionsCard: {
      marginTop: Spacing.sm,
      flex: 1,
      minHeight: ms(180),
      borderRadius: ms(18),
      borderWidth: 1,
      borderColor: "#C8DDDA",
      backgroundColor: "#FFFFFF",
      padding: Spacing.md,
    },
    captionsPlaceholderText: {
      ...Typography.body,
      color: semanticColors.text.primary,
      fontSize: ts(16),
      lineHeight: ts(20),
    },
    captionsSubText: {
      ...Typography.caption,
      color: semanticColors.text.secondary,
      marginTop: Spacing.xs,
      fontSize: ts(12),
      lineHeight: ts(16),
    },
  });
};