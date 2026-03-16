import React from "react";
<<<<<<< HEAD
import { Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/src/components/layout/Screen";
import { ScreenHeader, HeaderActionButton } from "@/src/components/layout/Header";
import { Typography, semanticColors } from "@/src/theme";

export default function FeedbackSettingsScreen() {
	return (
		<ScreenContainer backgroundColor="#F1F6F5">
			<ScreenHeader
				title="Feedback"
				right={<HeaderActionButton iconName="arrow-back" onPress={() => router.back()} />}
			/>
			<Text style={styles.body}>Feedback form is coming soon.</Text>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	body: {
		...Typography.body,
		color: semanticColors.text.secondary,
	},
});
=======
import { View, Text, StyleSheet } from "react-native";

export default function FeedbackScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Feedback</Text>
      <Text style={styles.body}>
        Feedback form will go here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  body: { fontSize: 16, color: "#444" },
});
>>>>>>> feature/dictionary-settings-nav
