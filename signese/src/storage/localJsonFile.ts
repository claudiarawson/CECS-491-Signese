import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";

/**
 * Persists JSON in the app document directory on native (avoids AsyncStorage TurboModule issues on iOS)
 * and uses localStorage on web.
 */
export async function readLocalJson<T>(fileName: string, webStorageKey: string, fallback: T): Promise<T> {
  if (Platform.OS === "web") {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(webStorageKey) : null;
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  const dir = FileSystem.documentDirectory;
  if (!dir) return fallback;

  const path = `${dir}${fileName}`;
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) return fallback;
    const raw = await FileSystem.readAsStringAsync(path);
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeLocalJson<T>(fileName: string, webStorageKey: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(webStorageKey, json);
    return;
  }
  const dir = FileSystem.documentDirectory;
  if (!dir) throw new Error("documentDirectory unavailable");
  await FileSystem.writeAsStringAsync(`${dir}${fileName}`, json, { encoding: "utf8" });
}
