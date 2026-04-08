import { useCallback, useState } from "react";
import { Platform } from "react-native";
import { CameraFacing, toggleFacing } from "./cameraControls";
import { useTranslateCameraPermission } from "./permission";

export function useTranslateCamera() {
	const [cameraActive, setCameraActive] = useState(false);
	const [cameraFacing, setCameraFacing] = useState<CameraFacing>("front");
	const { permission, requestIfNeeded } = useTranslateCameraPermission();

	const activateCamera = useCallback(async () => {
		const granted = await requestIfNeeded();
		if (!granted) {
			return false;
		}

		setCameraActive(true);
		return true;
	}, [requestIfNeeded]);

	const deactivateCamera = useCallback(() => {
		setCameraActive(false);
	}, []);

	const toggleCamera = useCallback(async () => {
		if (cameraActive) {
			deactivateCamera();
			return;
		}

		await activateCamera();
	}, [activateCamera, cameraActive, deactivateCamera]);

	const reverseCamera = useCallback(() => {
		if (Platform.OS === "web") {
			return;
		}

		setCameraFacing((previous) => toggleFacing(previous));
	}, []);

	return {
		permission,
		cameraActive,
		cameraFacing,
		activateCamera,
		deactivateCamera,
		toggleCamera,
		reverseCamera,
	};
}
