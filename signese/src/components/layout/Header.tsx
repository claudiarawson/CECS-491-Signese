import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Spacing, Typography, Sizes, fontScale, navigationStyles } from "@/src/theme";

type ScreenHeaderProps = {
	title: string;
	right?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	showBottomAccent?: boolean;
};

export function ScreenHeader({
	title,
	right,
	style,
	showBottomAccent = true,
}: ScreenHeaderProps) {
	return (
		<View style={[styles.container, showBottomAccent && styles.accent, style]}>
			<Text style={styles.title}>{title}</Text>
			<View style={styles.rightWrap}>{right}</View>
		</View>
	);
}

export { HeaderActionButton, HeaderAvatarButton } from "./HeaderActions";

const styles = StyleSheet.create({
	container: {
		minHeight: Sizes.headerHeight,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingTop: Spacing.xs * 0.6,
		paddingBottom: Spacing.xs,
	},
	accent: {
		...navigationStyles.topHeaderAccent,
		marginHorizontal: -Spacing.screenPadding,
		paddingHorizontal: Spacing.screenPadding,
		marginBottom: Spacing.xs,
	},
	title: {
		...Typography.screenTitle,
		fontSize: fontScale(21),
		lineHeight: fontScale(26),
	},
	rightWrap: {
		flexDirection: "row",
		alignItems: "center",
		gap: Spacing.xs,
	},
});

