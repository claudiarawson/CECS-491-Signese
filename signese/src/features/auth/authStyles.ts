import { Platform, StyleSheet } from "react-native";
import { Spacing, fontWeight, moderateScale } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

export function createAuthScreenStyles(density: number) {
  const ms = (v: number) => moderateScale(v) * density;

  return StyleSheet.create({
    flex: { flex: 1 },
    keyboard: { flex: 1 },
    topRow: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: Platform.select({ ios: ms(8), android: ms(10), default: ms(10) }),
    },
    backBtn: {
      width: ms(40),
      height: ms(40),
      borderRadius: ms(20),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      ...asl.shadow.card,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(8),
      paddingBottom: ms(32),
      justifyContent: "center",
    },
    centerBlock: {
      width: "100%",
      maxWidth: 420,
      alignSelf: "center",
    },
    logo: {
      width: ms(72),
      height: ms(72),
      borderRadius: ms(36),
      alignSelf: "center",
      marginBottom: ms(16),
      borderWidth: 2,
      borderColor: "rgba(244, 114, 182, 0.35)",
    },
    title: {
      fontSize: ms(28),
      lineHeight: ms(34),
      textAlign: "center",
      color: asl.text.primary,
      fontWeight: fontWeight.emphasis,
    },
    subtitle: {
      marginTop: ms(8),
      fontSize: ms(15),
      lineHeight: ms(22),
      textAlign: "center",
      color: asl.text.secondary,
      marginBottom: ms(20),
    },
    errorText: {
      color: "#FCA5A5",
      fontSize: ms(13),
      marginTop: ms(4),
      marginBottom: ms(8),
      fontWeight: fontWeight.medium,
    },
    successText: {
      color: "#4ADE80",
      fontSize: ms(13),
      marginTop: ms(4),
      marginBottom: ms(8),
      fontWeight: fontWeight.medium,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      marginTop: ms(18),
      gap: ms(6),
    },
    link: {
      color: asl.accentCyan,
      fontSize: ms(14),
      fontWeight: fontWeight.medium,
    },
    linkMuted: {
      color: asl.text.muted,
      fontSize: ms(14),
    },
    passwordWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: asl.glass.border,
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingHorizontal: 14,
      minHeight: 48,
      marginBottom: 14,
    },
    passwordInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 16,
      color: asl.text.primary,
    },
    eyeBtn: {
      padding: ms(4),
    },
    labelRow: {
      marginBottom: 6,
    },
    label: {
      color: asl.text.secondary,
      fontSize: 12,
      fontWeight: fontWeight.medium,
    },
    submitPress: {
      borderRadius: 999,
      overflow: "hidden",
      marginTop: ms(4),
      alignSelf: "stretch",
    },
    submitGradient: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    submitText: {
      color: asl.text.primary,
      fontSize: 16,
      letterSpacing: 0.3,
      fontWeight: fontWeight.emphasis,
    },
    submitDimmed: {
      opacity: 0.65,
    },
  });
}

