import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { semanticColors, Spacing } from "@/src/theme";
import { ScreenContainer, ScreenHeader, HeaderActionButton, HeaderAvatarButton } from "@/src/components/layout";

export default function LearnScreen() {
  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader
        title="Learn"
        right={
          <>
            <HeaderActionButton
              iconName="settings"
              onPress={() => router.push("/(tabs)/settings")}
            />
            <HeaderAvatarButton avatar="🐨" onPress={() => router.push("/(tabs)/account")} />
          </>
        }
      />
      <View style={styles.content}>
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Learn Screen</Text>
          <Text style={styles.placeholderSubtext}>Coming Soon</Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenPadding,
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: "700",
    color: semanticColors.text.primary,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: semanticColors.text.secondary,
  },
});
