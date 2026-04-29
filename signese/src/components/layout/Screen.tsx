import { Spacing } from "@/src/theme";
import { navigationTheme } from "@/src/theme/navigation";
import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenContainerProps = {
	children: React.ReactNode;
	backgroundColor?: string;
	contentStyle?: StyleProp<ViewStyle>;
	safeStyle?: StyleProp<ViewStyle>;
	contentPadded?: boolean;
};

export function ScreenContainer({
	children,
	backgroundColor = "#F1F6F5",
	contentStyle,
	safeStyle,
	contentPadded = false,
}: ScreenContainerProps) {
	return (
		<SafeAreaView 
			style={[styles.safe, { backgroundColor: navigationTheme.surface }, safeStyle]}
			edges={["top", "left", "right", "bottom"]}
		>
			<View style={[styles.content, { backgroundColor }, contentPadded && styles.padded, contentStyle]}>
				{children}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	padded: {
		paddingHorizontal: Spacing.screenPadding,
	},
});

