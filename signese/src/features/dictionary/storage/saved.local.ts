import type { Sign } from "../types";
import { readLocalJson, writeLocalJson } from "../../../storage/localJsonFile";

const FILE_NAME = "saved_signs.json";
const WEB_STORAGE_KEY = "signese_saved_signs_v2";

type SavedStoreV2 = {
  version: 2;
  entries: Record<string, Sign>;
};

const emptyStore = (): SavedStoreV2 => ({ version: 2, entries: {} });

function minimalPlaceholderSign(id: string): Sign {
  return {
    id,
    word: "Saved sign",
    definition: "Open the dictionary when online to refresh details.",
    howToSign: "Sign details not cached.",
    source: "featured",
  };
}

function normalizeStore(parsed: unknown): SavedStoreV2 {
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>;
    if (o.version === 2 && o.entries && typeof o.entries === "object") {
      return { version: 2, entries: o.entries as Record<string, Sign> };
    }
  }
  if (Array.isArray(parsed)) {
    const entries: Record<string, Sign> = {};
    for (const id of parsed) {
      if (typeof id === "string") entries[id] = minimalPlaceholderSign(id);
    }
    return { version: 2, entries };
  }
  return emptyStore();
}

async function loadStore(): Promise<SavedStoreV2> {
  try {
    const raw = await readLocalJson<unknown | null>(FILE_NAME, WEB_STORAGE_KEY, null);
    if (raw === null) return emptyStore();
    return normalizeStore(raw);
  } catch (e) {
    console.error("[saved.local] load failed", e);
    return emptyStore();
  }
}

async function persistStore(store: SavedStoreV2): Promise<void> {
  await writeLocalJson(FILE_NAME, WEB_STORAGE_KEY, store);
}

/**
 * Merge catalog + locally saved snapshot: canonical text from Firestore when present,
 * keep media-related fields from a snapshot when the catalog omits them.
 */
export function mergeSignWithSnapshot(catalog: Sign | undefined, snapshot: Sign | undefined): Sign | null {
  if (!catalog && !snapshot) return null;
  if (!catalog) return snapshot!;
  if (!snapshot) return catalog;
  return {
    ...catalog,
    mediaUrl: catalog.mediaUrl ?? snapshot.mediaUrl,
    storagePath: catalog.storagePath ?? snapshot.storagePath,
    videoId: catalog.videoId ?? snapshot.videoId,
    videoPath: catalog.videoPath ?? snapshot.videoPath,
  };
}

export async function getSavedIds(): Promise<string[]> {
  try {
    const store = await loadStore();
    return Object.keys(store.entries);
  } catch (error) {
    console.error("Error getting saved IDs:", error);
    return [];
  }
}

export async function getSavedSnapshotMap(): Promise<Record<string, Sign>> {
  try {
    const store = await loadStore();
    return { ...store.entries };
  } catch (error) {
    console.error("Error getting saved snapshots:", error);
    return {};
  }
}

/**
 * @param sign Optional snapshot of the sign when saving; stored so video paths/URLs
 * remain available offline or when the catalog row is missing fields.
 */
export async function toggleSavedId(signId: string, sign?: Sign): Promise<boolean> {
  try {
    const store = await loadStore();
    const isCurrentlySaved = signId in store.entries;
    if (isCurrentlySaved) {
      delete store.entries[signId];
    } else {
      const snapshot = sign ?? minimalPlaceholderSign(signId);
      store.entries[signId] = { ...snapshot, id: signId };
    }
    await persistStore(store);
    return !isCurrentlySaved;
  } catch (error) {
    console.error("Error toggling saved ID:", error);
    return false;
  }
}

export async function isSaved(signId: string): Promise<boolean> {
  try {
    const store = await loadStore();
    return signId in store.entries;
  } catch (error) {
    console.error("Error checking if saved:", error);
    return false;
  }
}
