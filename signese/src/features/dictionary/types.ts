// src/features/dictionary/types.ts

export type Category = {
  id: string;
  label: string;
  icon?: string;
};

export type SignSource = "featured" | "community";

/** Provenance for text fields (not the WLASL video host). */
export type ContentSourceMeta = {
  definition?: string | null;
  signNotes?: string | null;
};

/**
 * Raw shape from Firestore `dictionarySigns/{docId}` (subset; fields may be missing).
 * Existing uploads include WLASL pipeline fields; metadata is added over time.
 */
export type DictionarySignDocument = {
  word?: string;
  gloss?: string;
  labelId?: number;
  videoId?: string;
  /** Object path in Firebase Storage (e.g. "07069.mp4" at bucket root). */
  storagePath?: string;
  /** Alias some docs may use; prefer storagePath when present. */
  videoPath?: string;
  /** Optional cached HTTPS URL (usually resolved client-side from Storage). */
  videoUrl?: string;
  definition?: string;
  howToSign?: string;
  notes?: string;
  /** WLASL / dataset video host (e.g. startasl). */
  source?: string;
  /** Where definition / sign copy came from (dictionary API, manual, AI draft, etc.). */
  contentSource?: ContentSourceMeta;
  frameStart?: number;
  frameEnd?: number;
  fps?: number;
  searchTerms?: string[];
  isActive?: boolean;
  isCommunity?: boolean;
  tags?: string[];
  categoryId?: string;
  status?: "draft" | "reviewed" | string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

/** UI model for cards and overlays (always has display strings; use placeholders when incomplete). */
export type Sign = {
  id: string;
  word: string;
  mediaUrl?: string;
  definition: string;
  howToSign: string;
  note?: string;
  categoryId?: string;
  source: SignSource;
  videoId?: string;
  videoPath?: string;
  storagePath?: string;
  /** Copy / editorial status for badges. */
  status?: string;
  contentSource?: ContentSourceMeta;
};
