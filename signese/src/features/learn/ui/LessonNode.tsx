import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { scale, verticalScale, fontScale } from "@/src/theme/responsive";
import { brandColors, semanticColors } from "@/src/theme/colors";

type LessonNodeProps = {
	title: string;
	icon?: any; // image source
	active?: boolean;
	completed?: boolean;
	onPress?: () => void;
};

export function LessonNode({ title, icon, active, completed, onPress }: LessonNodeProps) {
	return (
		<View style={[styles.circle, active && styles.activeCircle, completed && styles.completedCircle]}>
			{icon && <Image source={icon} style={styles.icon} resizeMode="contain" />}
			<Text style={styles.title}>{title}</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	circle: {
		width: scale(72),
		height: scale(72),
		borderRadius: scale(36),
		backgroundColor: brandColors.white,
		borderWidth: scale(4),
		borderColor: brandColors.primary,
		alignItems: "center",
		justifyContent: "center",
		shadowColor: brandColors.dark,
		shadowOpacity: 0.08,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 8,
		elevation: 2,
		marginBottom: verticalScale(12),
	},
	activeCircle: {
		borderColor: brandColors.secondary,
		backgroundColor: brandColors.bgTealLight,
	},
	completedCircle: {
		borderColor: brandColors.tertiary,
		backgroundColor: brandColors.bgPurpleLight,
	},
	icon: {
		width: scale(32),
		height: scale(32),
		marginBottom: verticalScale(4),
	},
	title: {
		fontSize: fontScale(15),
		color: semanticColors.text.primary,
		fontWeight: "600",
		textAlign: "center",
	},
});
