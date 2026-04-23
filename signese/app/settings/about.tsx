import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScreenContainer, ScreenHeader, SectionCard } from "@/src/components/layout";

export default function AboutScreen() {
  return (
    <ScreenContainer backgroundColor="#F1F6F5">
      <ScreenHeader title="About" showBackButton />
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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
    paddingBottom: 24,
  },
  heroCard: {
    paddingVertical: 16,
    alignItems: "center",
    gap: 4,
  },
  heroEmoji: {
    fontSize: 34,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
  card: {
    paddingVertical: 16,
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
    color: "#111827",
    flex: 1,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },
});
