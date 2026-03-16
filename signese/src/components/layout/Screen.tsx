import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "@/src/theme";

type ScreenContainerProps = {
	children: React.ReactNode;
	backgroundColor?: string;
	contentStyle?: StyleProp<ViewStyle>;
	safeStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
	children,
	backgroundColor = "#F1F6F5",
	contentStyle,
	safeStyle,
}: ScreenContainerProps) {
	return (
		<SafeAreaView style={[styles.safe, { backgroundColor }, safeStyle]}>
			<View style={[styles.content, contentStyle]}>{children}</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
	},
	content: {
		flex: 1,
		paddingHorizontal: Spacing.screenPadding,
	},
});

