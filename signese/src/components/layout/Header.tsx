import { Sizes, Typography, fontWeight, semanticColors } from "@/src/theme";
import { navigationTheme } from "@/src/theme/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from "react-native";

type ScreenHeaderProps = {
	title?: string;
	right?: React.ReactNode;
	left?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	titleStyle?: StyleProp<TextStyle>;
	showBottomAccent?: boolean;
	showBackButton?: boolean;
	onBackPress?: () => void;
};

export function ScreenHeader({
	title,
	right,
	left,
	style,
	titleStyle,
	showBottomAccent = true,
	showBackButton = false,
	onBackPress}: ScreenHeaderProps) {
	const handleBack = onBackPress ?? (() => router.back());

	return (
		<View style={[styles.container, showBottomAccent && styles.accent, style]}>
			<View style={styles.innerContent}>
				<View style={styles.leftWrap}>
					{showBackButton && (
						<Pressable style={styles.backButton} onPress={handleBack} hitSlop={8}>
							<MaterialIcons
								name="arrow-back-ios-new"
								size={Sizes.iconSm + 2}
								color={semanticColors.text.primary}
							/>
						</Pressable>
					)}
					{left}
				</View>
				{title && <Text style={[styles.title, titleStyle]}>{title}</Text>}
				<View style={styles.rightWrap}>{right}</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: navigationTheme.surface},
	innerContent: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 20},
	accent: {
		borderBottomWidth: 1,
		borderBottomColor: navigationTheme.border},
	leftWrap: {
		flexDirection: "row",
		alignItems: "center",
		minWidth: 72},
	backButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#F2F7F8",
		alignItems: "center",
		justifyContent: "center",
		marginRight: 6},
	title: {
		...Typography.screenTitle,
		fontSize: 19,
		lineHeight: 24,
		flex: 1,
		textAlign: "center",
		fontWeight: fontWeight.emphasis},
	rightWrap: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		minWidth: 96,
		columnGap: 10}});

