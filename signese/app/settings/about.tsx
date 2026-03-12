import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";

export default function AboutScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerText}>About</Text>
      </View>

      {/* Section 1 */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>i</Text>
          </View>
          <Text style={styles.sectionTitle}>What is Signese?</Text>
        </View>

        <Text style={styles.bodyText}>
          Signese is an all-in-one American Sign Language (ASL) app for learning,
          community-intertwined dictionary, and live translation to support
          non-signers better interact with and understand signers.
        </Text>
      </View>

      {/* Section 2 */}
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>i</Text>
          </View>
          <Text style={styles.sectionTitle}>What is our purpose?</Text>
        </View>

        <Text style={styles.bodyText}>
          Our purpose is to create a mobile application that translates ASL
          into spoken or written language. Our values center on accessibility,
          inclusivity, and innovation. We aim to address real communication
          barriers faced by the deaf and hard-of-hearing community by
          leveraging computer vision and LLMs to make conversations easier,
          faster, and more natural between signers and non-signers.
        </Text>
      </View>

      {/* Back Button */}
      <Pressable style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>&lt;&lt; Back</Text>
      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef7f6",
  },

  header: {
    backgroundColor: "#d9edf7",
    paddingVertical: 20,
    alignItems: "center",
  },

  headerText: {
    fontSize: 22,
    fontWeight: "800",
  },

  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#d9edf7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  iconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2563eb",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#333",
  },

  backBtn: {
    marginTop: 30,
    marginLeft: 20,
    backgroundColor: "#4fa99b",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignSelf: "flex-start",
  },

  backText: {
    color: "white",
    fontWeight: "700",
  },
});