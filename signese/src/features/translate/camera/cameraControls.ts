export type CameraFacing = "front" | "back";

export function toggleFacing(current: CameraFacing): CameraFacing {
	return current === "front" ? "back" : "front";
}

export function toggleActive(current: boolean): boolean {
	return !current;
}
