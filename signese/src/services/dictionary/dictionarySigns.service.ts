import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
  type QuerySnapshot,
} from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/src/services/firebase/firebase.config";
import type { DictionarySignDocument, Sign } from "@/src/features/dictionary/types";
import { normalizeSignCategories } from "@/src/features/dictionary/signCategories";

const DICTIONARY_COLLECTION = "dictionarySigns";

/**
 * Page size for Firestore dictionary queries (cursor pagination on `word`).
 * Does NOT bulk-resolve Storage URLs — those run when a card opens (one URL at a time).
 *
 * - `EXPO_PUBLIC_DICTIONARY_PAGE_SIZE=200` — override chunk size (default **100**, max 500).
 */
export function getDictionaryPageSize(): number {
  const raw = process.env.EXPO_PUBLIC_DICTIONARY_PAGE_SIZE;
  if (raw != null && String(raw).trim() !== "") {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return Math.min(Math.floor(n), 500);
  }
  return 100;
}

/**
 * @deprecated Prefer `fetchDictionarySignsPage` + paging in the UI. Kept for compatibility.
 * The app no longer caps the dictionary at 200 documents.
 */
export function getDictionaryQueryLimit(): number | undefined {
  return undefined;
}

const PLACEHOLDER_DEFINITION = "Definition not added yet.";
const PLACEHOLDER_HOW_TO_SIGN =
  "How-to description not added yet. Our team reviews sign instructions for accuracy—ASL varies by region.";

function nonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

/**
 * Maps a Firestore document into the UI `Sign` model with safe placeholders.
 */
export function mapDocumentToSign(
  docId: string,
  data: DictionarySignDocument,
  resolvedVideoUrl?: string
): Sign {
  const word = nonEmpty(data.word) ? data.word.trim() : nonEmpty(data.gloss) ? String(data.gloss).trim() : docId;
  const path = effectiveStorageObjectPath(data);

  const mediaUrl = nonEmpty(data.videoUrl) ? data.videoUrl.trim() : resolvedVideoUrl ?? undefined;
  const categories = normalizeSignCategories(data.categories);

  return {
    id: docId,
    word,
    definition: nonEmpty(data.definition) ? data.definition.trim() : PLACEHOLDER_DEFINITION,
    howToSign: nonEmpty(data.howToSign) ? data.howToSign.trim() : PLACEHOLDER_HOW_TO_SIGN,
    note: nonEmpty(data.notes)
      ? data.notes.trim()
      : nonEmpty((data as { note?: string }).note)
        ? String((data as { note?: string }).note).trim()
        : undefined,
    categoryId: nonEmpty(data.categoryId) ? data.categoryId : undefined,
    source: data.isCommunity ? "community" : "featured",
    mediaUrl,
    videoId: nonEmpty(data.videoId) ? data.videoId : undefined,
    videoPath: path,
    storagePath: path,
    status: nonEmpty(data.status) ? data.status : "draft",
    contentSource: data.contentSource,
    categories,
  };
}

/** Best path to the object in Storage (bucket root: `{videoId}.mp4`). */
export function effectiveStorageObjectPath(data: DictionarySignDocument): string | undefined {
  const p = nonEmpty(data.storagePath)
    ? data.storagePath.trim()
    : nonEmpty(data.videoPath)
      ? data.videoPath.trim()
      : "";
  if (p) return p.replace(/^\/+/, "");
  const vid = data.videoId;
  if (nonEmpty(vid)) return `${String(vid).trim()}.mp4`;
  return undefined;
}

/** In-memory cache: one `getDownloadURL` per path, then instant replays (huge for demos). */
const downloadUrlCache = new Map<string, string>();
const CACHE_MAX = 600;

const RESOLVE_TIMEOUT_MS = 15_000;

function cacheDownloadUrl(path: string, url: string): void {
  if (downloadUrlCache.size >= CACHE_MAX) {
    const k = downloadUrlCache.keys().next().value;
    if (k) downloadUrlCache.delete(k);
  }
  downloadUrlCache.set(path, url);
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} (${ms}ms)`)), ms);
    promise
      .then((v) => {
        clearTimeout(t);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(t);
        reject(e);
      });
  });
}

async function tryResolveStorageUrl(storagePath: string): Promise<string | undefined> {
  const path = storagePath.replace(/^\/+/, "");
  const hit = downloadUrlCache.get(path);
  if (hit) return hit;
  try {
    const r = ref(storage, path);
    const url = await withTimeout(
      getDownloadURL(r),
      RESOLVE_TIMEOUT_MS,
      "Video link timed out — check network and Storage rules"
    );
    cacheDownloadUrl(path, url);
    return url;
  } catch (e) {
    if (__DEV__) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`[dictionary] getDownloadURL failed for "${path}":`, msg);
    }
    return undefined;
  }
}

/**
 * Start resolving the URL early (e.g. on press-in) so the modal often opens with a warm cache.
 */
export function prefetchDictionaryVideoUrl(sign: {
  mediaUrl?: string;
  storagePath?: string;
  videoPath?: string;
  videoId?: string;
}): void {
  if (nonEmpty(sign.mediaUrl)) return;
  const path = effectiveStorageObjectPath({
    storagePath: sign.storagePath,
    videoPath: sign.videoPath,
    videoId: sign.videoId,
  });
  if (!path || downloadUrlCache.has(path)) return;
  void tryResolveStorageUrl(path);
}

/**
 * Resolve a playable HTTPS URL for a sign (used on the client after fetch, e.g. overlay retry).
 */
export async function resolveVideoUrlForDocument(
  data: DictionarySignDocument
): Promise<string | undefined> {
  if (nonEmpty(data.videoUrl)) return data.videoUrl!.trim();
  const path = effectiveStorageObjectPath(data);
  if (!path) return undefined;
  return tryResolveStorageUrl(path);
}

/** Retry helper for UI when list fetch did not get a URL (e.g. rules fixed, or transient failure). */
export async function resolveVideoUrlFromUiSign(sign: {
  mediaUrl?: string;
  storagePath?: string;
  videoPath?: string;
  videoId?: string;
}): Promise<string | undefined> {
  if (nonEmpty(sign.mediaUrl)) return sign.mediaUrl.trim();
  const path = effectiveStorageObjectPath({
    storagePath: sign.storagePath,
    videoPath: sign.videoPath,
    videoId: sign.videoId,
  });
  if (!path) return undefined;
  return tryResolveStorageUrl(path);
}

function snapToSignRows(snap: QuerySnapshot): Sign[] {
  const rows: { id: string; data: DictionarySignDocument }[] = [];
  snap.forEach((d) => {
    const data = d.data() as DictionarySignDocument;
    if (data.isActive === false) return;
    rows.push({ id: d.id, data });
  });
  return rows.map(({ id, data }) => {
    const precomputed = nonEmpty(data.videoUrl) ? data.videoUrl.trim() : undefined;
    return mapDocumentToSign(id, data, precomputed);
  });
}

/**
 * One page of dictionary signs, ordered by Firestore field `word`.
 * Cursor is the last **raw** document in the snapshot (including inactive), so pagination stays aligned with the server order.
 */
export async function fetchDictionarySignsPage(
  cursor: QueryDocumentSnapshot | null
): Promise<{
  signs: Sign[];
  lastDoc: QueryDocumentSnapshot | null;
  hasMore: boolean;
}> {
  const pageSize = getDictionaryPageSize();
  const col = collection(db, DICTIONARY_COLLECTION);
  const q = cursor
    ? query(col, orderBy("word"), startAfter(cursor), limit(pageSize))
    : query(col, orderBy("word"), limit(pageSize));
  const snap = await getDocs(q);
  const signs = snapToSignRows(snap);
  const lastDoc =
    snap.docs.length > 0 ? (snap.docs[snap.docs.length - 1] as QueryDocumentSnapshot) : null;
  const hasMore = snap.docs.length === pageSize;
  return { signs, lastDoc, hasMore };
}

/**
 * Loads the full dictionary (all pages). Prefer `fetchDictionarySignsPage` in the app for progressive loading.
 * Intentionally does **not** call `getDownloadURL` for every row (that was freezing cold start).
 */
export async function fetchDictionarySigns(): Promise<Sign[]> {
  const out: Sign[] = [];
  let cursor: QueryDocumentSnapshot | null = null;
  let hasMore = true;
  while (hasMore) {
    const page = await fetchDictionarySignsPage(cursor);
    out.push(...page.signs);
    cursor = page.lastDoc;
    hasMore = page.hasMore;
  }
  return out;
}

/**
 * If you later add a secondary query (e.g. by doc id), reuse mapDocumentToSign + tryResolveStorageUrl.
 */
export { DICTIONARY_COLLECTION, PLACEHOLDER_DEFINITION, PLACEHOLDER_HOW_TO_SIGN };
