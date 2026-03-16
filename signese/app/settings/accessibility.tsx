import React from "react";
import { Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer, ScreenHeader, HeaderActionButton } from "@/src/components/layout";
import { Typography, semanticColors } from "@/src/theme";

export default function AccessibilitySettingsScreen() {
	return (
		<ScreenContainer backgroundColor="#F1F6F5">
			<ScreenHeader
				title="Accessibility"
				right={<HeaderActionButton iconName="arrow-back" onPress={() => router.back()} />}
			/>
			<Text style={styles.body}>Accessibility settings are coming soon.</Text>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
<<<<<<< HEAD
	body: {
		...Typography.body,
		color: semanticColors.text.secondary,
	},
});
=======
  container: {
    flex: 1,
    backgroundColor: "#eef7f6",
  },

  header: {
    backgroundColor: "#f3d6cc",
    paddingVertical: 20,
    alignItems: "center",
  },

  headerText: {
    fontSize: 22,
        <View style={styles.header}>
          <Text style={styles.headerText}>Accessibility</Text>
        </View>
  card: {
    backgroundColor: "#ffffff",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  leftSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: "#fde7dd",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  iconText: {
    fontWeight: "700",
    fontSize: 18,
    color: "#f97316",
  },

  label: {
    fontSize: 16,
    fontWeight: "600",
  },

  backBtn: {
    marginTop: 40,
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
>>>>>>> b3b93d4c (Update About and Accessibility pages with real content)
