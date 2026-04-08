/**
 * Community “Add Sign” submission: Storage upload → Firestore `dictionarySigns` document.
 *
 * ---------------------------------------------------------------------------
 * Firestore document shape (collection: `dictionarySigns`, auto-generated doc id)
 * ---------------------------------------------------------------------------
 * {
 *   word: string,
 *   definition: string,
 *   howToSign: string,
 *   notes: string,
 *   isCommunity: true,
 *   isCommunitySign: true,
 *   communitySign: true,
 *   isActive: true,
 *   source: "community",
 *   status: "draft",
 *   storagePath: string,
 *   videoPath: string,
 *   videoUrl: "",
 *   contributorUid: string,
 *   searchTerms: string[],
 *   createdAt: serverTimestamp(),
 *   updatedAt: serverTimestamp(),
 * }
 *
 * `storagePath` and `videoPath` match the app convention (`effectiveStorageObjectPath` in
 * dictionarySigns.service.ts). Both are set to the same Storage object path, e.g.
 * "community_signs/communitysign_1730000000000_hello.mp4".
 *
 * Uses `community_signs/` (underscores, no spaces) so Storage security rules can match the
 * path reliably. The old "Community Signs/" name is easy to misconfigure in rules.
 */

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { deleteObject, ref, uploadBytesResumable } from "firebase/storage";
import * as FileSystem from "expo-file-system/legacy";
import { auth, db, storage } from "@/src/services/firebase/firebase.config";
import { buildCommunityVideoFileName } from "@/src/features/dictionary/communitySignFilename";
import { DICTIONARY_COLLECTION } from "@/src/services/dictionary/dictionarySigns.service";

/** Must match your Storage rules (see `docs/firebase-add-sign-rules.md`). */
const COMMUNITY_STORAGE_PREFIX = "community_signs";

export type CommunitySignFormValues = {
  word: string;
  definition: string;
  howToSign: string;
  /** Optional; stored as empty string when missing. */
  note: string;
};

export type SubmitCommunitySignSuccess = {
  docId: string;
  /** Full Storage object path (same as `videoPath` on the doc). */
  storagePath: string;
};

export type CommunitySignSubmitErrorCode =
  | "missing_word"
  | "missing_definition"
  | "missing_how_to_sign"
  | "missing_video"
  | "not_authenticated"
  | "read_file_failed"
  | "upload_failed"
  | "firestore_failed";

export class CommunitySignSubmitError extends Error {
  readonly code: CommunitySignSubmitErrorCode;

  constructor(code: CommunitySignSubmitErrorCode, message: string) {
    super(message);
    this.name = "CommunitySignSubmitError";
    this.code = code;
  }
}

function validateForm(values: CommunitySignFormValues): void {
  if (!values.word.trim()) {
    throw new CommunitySignSubmitError("missing_word", "Please enter a word or sign.");
  }
  if (!values.definition.trim()) {
    throw new CommunitySignSubmitError("missing_definition", "Please enter a definition.");
  }
  if (!values.howToSign.trim()) {
    throw new CommunitySignSubmitError("missing_how_to_sign", "Please enter how to sign.");
  }
}

function validateVideoUri(uri: string | null | undefined): asserts uri is string {
  if (!uri || typeof uri !== "string" || uri.trim().length === 0) {
    throw new CommunitySignSubmitError("missing_video", "Please choose a sign video.");
  }
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Reads a local video URI into bytes for Firebase Storage upload.
 * Tries `fetch(uri).blob()` first (works on many Expo targets); falls back to base64 read.
 */
async function readVideoBytes(uri: string): Promise<Uint8Array | Blob> {
  try {
    const res = await fetch(uri);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    if (blob && blob.size > 0) {
      return blob;
    }
  } catch {
    // fall through to FileSystem
  }

  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64",
    });
    return base64ToUint8Array(base64);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new CommunitySignSubmitError("read_file_failed", `Could not read the video file. ${msg}`);
  }
}

async function deleteUploadedObject(storagePath: string): Promise<void> {
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // best-effort cleanup
  }
}

export type SubmitCommunitySignOptions = {
  /** 0–1 progress while uploading. */
  onUploadProgress?: (ratio: number) => void;
};

/**
 * Validates input, uploads video to `community_signs/{filename}.mp4`, then creates a Firestore doc.
 * If Firestore fails after upload, deletes the Storage object to avoid orphans.
 */
export async function submitCommunitySign(
  formValues: CommunitySignFormValues,
  selectedVideoUri: string | null | undefined,
  options?: SubmitCommunitySignOptions
): Promise<SubmitCommunitySignSuccess> {
  validateForm(formValues);
  validateVideoUri(selectedVideoUri);

  const user = auth.currentUser;
  if (!user) {
    throw new CommunitySignSubmitError("not_authenticated", "Please sign in to submit a community sign.");
  }

  // Refresh ID token so Storage requests include a valid credential (helps web + stale sessions).
  try {
    await user.getIdToken(true);
  } catch {
    throw new CommunitySignSubmitError("not_authenticated", "Session expired. Please sign in again.");
  }

  const word = formValues.word.trim();
  const definition = formValues.definition.trim();
  const howToSign = formValues.howToSign.trim();
  const notes = formValues.note.trim();

  const fileName = buildCommunityVideoFileName(word);
  const storagePath = `${COMMUNITY_STORAGE_PREFIX}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  const raw = await readVideoBytes(selectedVideoUri!);
  const uploadTask = uploadBytesResumable(storageRef, raw, {
    contentType: "video/mp4",
  });

  uploadTask.on("state_changed", (snapshot) => {
    const total = snapshot.totalBytes;
    if (total > 0 && options?.onUploadProgress) {
      options.onUploadProgress(snapshot.bytesTransferred / total);
    }
  });

  try {
    await uploadTask;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const hint =
      /permission|unauthorized/i.test(msg)
        ? " Check Firebase Storage rules for path `community_signs/*` and that rules use `match /b/{bucket}/o` (not `objects`)."
        : "";
    throw new CommunitySignSubmitError("upload_failed", `Video upload failed: ${msg}${hint}`);
  }

  const searchTerms = Array.from(
    new Set(
      [word, ...word.split(/\s+/).filter(Boolean)].map((s) => s.toLowerCase())
    )
  );

  const docPayload = {
    word,
    definition,
    howToSign,
    notes,
    isCommunity: true,
    isCommunitySign: true,
    communitySign: true,
    isActive: true,
    source: "community",
    status: "draft" as const,
    storagePath,
    videoPath: storagePath,
    videoUrl: "",
    contributorUid: user.uid,
    searchTerms,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    const col = collection(db, DICTIONARY_COLLECTION);
    const docRef = await addDoc(col, docPayload);
    return { docId: docRef.id, storagePath };
  } catch (e) {
    await deleteUploadedObject(storagePath);
    const msg = e instanceof Error ? e.message : String(e);
    throw new CommunitySignSubmitError("firestore_failed", `Could not save your sign: ${msg}`);
  }
}
