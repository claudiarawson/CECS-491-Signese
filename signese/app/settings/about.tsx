import React from "react";
import { Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import { ScreenContainer, ScreenHeader, HeaderActionButton } from "@/src/components/layout";
import { Typography, semanticColors } from "@/src/theme";

export default function AboutSettingsScreen() {
	return (
		<ScreenContainer backgroundColor="#F1F6F5">
			<ScreenHeader
				title="About"
				right={<HeaderActionButton iconName="arrow-back" onPress={() => router.back()} />}
			/>
			<Text style={styles.body}>About content is coming soon.</Text>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	body: {
		...Typography.body,
		color: semanticColors.text.secondary,
	},
});
