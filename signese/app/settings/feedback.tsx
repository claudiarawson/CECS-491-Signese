import React from "react";
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
