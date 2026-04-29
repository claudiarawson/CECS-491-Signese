import { readLocalJson, writeLocalJson } from "@/src/storage/localJsonFile";
import type { TranslationHistoryItem } from "./types";

const FILE_NAME = "translation_history_saved.json";
const WEB_KEY = "signese_translation_history_saved_v1";

const PREFS_FILE = "translation_history_prefs.json";
const PREFS_WEB_KEY = "signese_translation_history_prefs_v1";

export async function loadPersistedTranslationHistory(): Promise<TranslationHistoryItem[]> {
  const rows = await readLocalJson<TranslationHistoryItem[]>(FILE_NAME, WEB_KEY, []);
  return Array.isArray(rows) ? rows : [];
}

export async function savePersistedTranslationHistory(
  items: TranslationHistoryItem[]
): Promise<void> {
  await writeLocalJson(FILE_NAME, WEB_KEY, items);
}

export async function loadTranslationHistoryKeepOnDevice(): Promise<boolean> {
  const p = await readLocalJson<{ keepOnDevice?: boolean }>(PREFS_FILE, PREFS_WEB_KEY, {});
  return !!p.keepOnDevice;
}

export async function saveTranslationHistoryKeepOnDevice(keep: boolean): Promise<void> {
  await writeLocalJson(PREFS_FILE, PREFS_WEB_KEY, { keepOnDevice: keep });
}
