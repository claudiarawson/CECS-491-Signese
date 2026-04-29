import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Spacing, Typography, moderateScale, fontWeight } from "@/src/theme";
import { asl } from "@/src/theme/aslConnectTheme";

export function AccountSubScreenHeader({ title }: { title: string }) {
  return (
    <View style={subHeaderStyles.row}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [subHeaderStyles.iconBtn, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
      </Pressable>
      <Text style={subHeaderStyles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={subHeaderStyles.headerSpacer} />
    </View>
  );
}

const subHeaderStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: asl.text.primary,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
});

export function createAccountEditFormStyles(density: number, textScale: number) {
  const ms = (value: number) => moderateScale(value) * density;
  const ts = (value: number) => ms(value) * textScale;

  return StyleSheet.create({
    screenContent: {
      flex: 1,
      backgroundColor: "transparent",
    },
    keyboardAvoid: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: ms(40),
    },
    stack: {
      paddingHorizontal: Spacing.screenPadding,
      paddingTop: ms(16),
      gap: ms(14),
    },
    cardInner: {
      padding: ms(16),
    },
    sectionKicker: {
      ...Typography.caption,
      color: asl.text.muted,
      fontWeight: fontWeight.strong,
      fontSize: ts(12),
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: ms(10),
    },
    fieldHint: {
      ...Typography.caption,
      color: asl.text.secondary,
      fontSize: ts(14),
      lineHeight: ts(20),
      marginBottom: ms(12),
    },
    fieldHintMuted: {
      ...Typography.caption,
      color: asl.text.muted,
      fontSize: ts(14),
      lineHeight: ts(20),
    },
    inputLabel: {
      ...Typography.caption,
      color: asl.text.secondary,
      fontSize: ts(13),
      fontWeight: fontWeight.medium,
      marginBottom: ms(6),
    },
    textInput: {
      width: "100%",
      minHeight: ms(48),
      borderRadius: ms(14),
      backgroundColor: asl.glass.bg,
      borderWidth: 1,
      borderColor: asl.glass.border,
      paddingHorizontal: ms(14),
      paddingVertical: ms(12),
      fontSize: ts(16),
      lineHeight: ts(22),
      color: asl.text.primary,
      marginBottom: ms(12),
    },
    fieldError: {
      ...Typography.caption,
      color: "#FCA5A5",
      fontSize: ts(13),
      lineHeight: ts(18),
      marginBottom: ms(10),
    },
    primaryBtn: {
      marginTop: ms(4),
      minHeight: ms(48),
      borderRadius: ms(14),
      backgroundColor: "rgba(236, 72, 153, 0.88)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.25)",
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: ms(16),
    },
    btnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      ...Typography.button,
      fontSize: ts(16),
      lineHeight: ts(22),
      color: "#FFFFFF",
      fontWeight: fontWeight.strong,
    },
  });
}
