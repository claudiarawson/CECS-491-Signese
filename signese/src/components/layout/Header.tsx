import { Sizes, Spacing, Typography, fontScale, semanticColors } from "@/src/theme";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

type ScreenHeaderProps = {
	title?: string;
	right?: React.ReactNode;
	left?: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	showBottomAccent?: boolean;
	showBackButton?: boolean;
	onBackPress?: () => void;
};

export function ScreenHeader({
	title,
	right,
	left,
	style,
	showBottomAccent = true,
	showBackButton = false,
	onBackPress,
}: ScreenHeaderProps) {
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
				{title && <Text style={styles.title}>{title}</Text>}
				<View style={styles.rightWrap}>{right}</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		width: "100%",
		backgroundColor: "#FFFFFF",
		paddingTop: 36,
	},
	innerContent: {
		height: 48,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: Spacing.screenPadding,
	},
	accent: {
		borderBottomWidth: 1,
		borderBottomColor: "#DCE3E1",
	},
	leftWrap: {
		flexDirection: "row",
		alignItems: "center",
		width: 80,
	},
	backButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "#F2F7F8",
		alignItems: "center",
		justifyContent: "center",
		marginRight: Spacing.xs - 2,
	},
	title: {
		...Typography.screenTitle,
		fontSize: fontScale(19),
		lineHeight: fontScale(24),
		flex: 1,
		textAlign: "center",
	},
	rightWrap: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
		width: 80,
	},
});

