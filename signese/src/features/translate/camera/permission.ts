import { useCameraPermissions } from "expo-camera";

export function useTranslateCameraPermission() {
	const [permission, requestPermission] = useCameraPermissions();

	const requestIfNeeded = async (): Promise<boolean> => {
		if (permission?.granted) {
			return true;
		}

		const result = await requestPermission();
		return result.granted;
	};

	return {
		permission,
		requestIfNeeded,
	};
}
