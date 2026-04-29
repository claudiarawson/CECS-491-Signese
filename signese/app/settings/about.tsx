import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScreenContainer, SectionCard } from "@/src/components/layout";
import { GradientBackground } from "@/src/components/asl";
import { asl } from "@/src/theme/aslConnectTheme";
import { Spacing, fontWeight } from "@/src/theme";

function SettingsSubHeader({ title }: { title: string }) {
  return (
    <View style={styles.headerRow}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.85 }]}
      >
        <MaterialIcons name="arrow-back" size={22} color={asl.text.primary} />
      </Pressable>
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

export default function AboutScreen() {
  return (
    <GradientBackground variant="default" style={{ flex: 1 }}>
      <ScreenContainer
        backgroundColor="transparent"
        safeStyle={{ backgroundColor: "transparent" }}
        contentStyle={styles.screenContent}
        contentPadded={false}
      >
      <SettingsSubHeader title="About" />
      <ScrollView contentContainerStyle={styles.container}>
        <SectionCard style={styles.heroCard}>
          <Text style={styles.heroEmoji}>ℹ️</Text>
          <Text style={styles.heroTitle}>About Signese</Text>
          <Text style={styles.heroSubtitle}>
            Learn what the app does and the mission behind it.
          </Text>
        </SectionCard>

        <SectionCard style={styles.card}>
          <View style={styles.titleRow}>
            <View style={styles.iconBox}>
              <MaterialIcons name="info-outline" size={20} color="#6CB5D1" />
            </View>
            <Text style={styles.sectionTitle}>What is Signese?</Text>
          </View>
          <Text style={styles.bodyText}>
            Signese is an all-in-one American Sign Language (ASL) app for learning,
            community-intertwined dictionary, and live translation to support
            non-signers better interact with and understand signers.
          </Text>
        </SectionCard>

        <SectionCard style={styles.card}>
          <View style={styles.titleRow}>
            <View style={styles.iconBox}>
              <MaterialIcons name="lightbulb-outline" size={20} color="#6CB5D1" />
            </View>
            <Text style={styles.sectionTitle}>What is our purpose?</Text>
          </View>
          <Text style={styles.bodyText}>
            Our purpose is to create a mobile application that translates ASL into
            spoken or written language. Our values center on accessibility,
            inclusivity, and innovation. We aim to address real communication
            barriers faced by the deaf and hard-of-hearing community by leveraging
            computer vision and LLMs to make conversations easier, faster, and more
            natural between signers and non-signers.
          </Text>
        </SectionCard>
      </ScrollView>
    </ScreenContainer>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    backgroundColor: "transparent",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPadding,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: asl.glass.border,
    backgroundColor: "rgba(8,2,10,0.2)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 20,
    lineHeight: 26,
    fontWeight: fontWeight.emphasis,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  container: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 16,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: asl.text.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: asl.text.secondary,
    textAlign: "center",
  },
  card: {
    paddingVertical: 16,
    backgroundColor: asl.glass.bg,
    borderWidth: 1,
    borderColor: asl.glass.border,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: "#DDF1F8",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: asl.text.primary,
    flex: 1,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: asl.text.secondary,
  },
});
