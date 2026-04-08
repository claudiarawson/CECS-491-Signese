/**
 * build_firestore_records.js
 *
 * Reads the WLASL class list + WLASL JSON, picks one primary instance per gloss,
 * and writes Firestore-ready records (no external URLs).
 *
 * Usage (from this directory):
 *   node build_firestore_records.js
 *
 * Inputs (same folder as this script by default):
 *   ./wlasl_class_list.txt
 *   ./WLASL_v0.3.json
 *
 * Outputs:
 *   ./firestore_dictionarySigns.json
 *   ./unmatched_words.json
 */

"use strict";

const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Paths (resolve next to this script so cwd does not matter)
// ---------------------------------------------------------------------------

const ROOT = __dirname;
const PATH_CLASS_LIST = path.join(ROOT, "wlasl_class_list.txt");
const PATH_WLASL = path.join(ROOT, "WLASL_v0.3.json");
const PATH_OUT_RECORDS = path.join(ROOT, "firestore_dictionarySigns.json");
const PATH_OUT_UNMATCHED = path.join(ROOT, "unmatched_words.json");

/** Prefer these sources first (low index = higher priority). */
const SOURCE_PRIORITY = [
  "startasl",
  "signschool",
  "aslsearch",
  "handspeak",
  "asldeafined",
  "signingsavvy",
  "asllex",
  "aslsignbank",
  "aslpro",
];

/** Weak tiebreaker only (train < val < test). */
const SPLIT_ORDER = { train: 0, val: 1, test: 2 };

// ---------------------------------------------------------------------------
// Doc id + storage (bucket root: {videoId}.mp4)
// ---------------------------------------------------------------------------

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getStoragePath(videoId) {
  return `${videoId}.mp4`;
}

// ---------------------------------------------------------------------------
// Primary instance selection
// Uses `url` only to deprioritize .swf and prefer obvious .mp4 paths; never exported.
// ---------------------------------------------------------------------------

/**
 * @param {string | undefined} url
 * @returns {string}
 */
function pathnameLower(url) {
  if (!url || typeof url !== "string") return "";
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function isMp4(url) {
  return pathnameLower(url).endsWith(".mp4");
}

function isSwf(url) {
  return pathnameLower(url).endsWith(".swf");
}

/**
 * Lower index = more preferred source.
 * @param {string | undefined} source
 */
function sourceRank(source) {
  const s = (source || "").toLowerCase().trim();
  const i = SOURCE_PRIORITY.indexOf(s);
  return i === -1 ? 999 : i;
}

/**
 * Clip length in frames when frame_end is not -1; larger = longer (worse tie-break).
 * @param {object} inst
 */
function clipLength(inst) {
  const start = Number(inst.frame_start);
  const end = Number(inst.frame_end);
  if (end === -1) return 0;
  if (Number.isNaN(start) || Number.isNaN(end)) return 1e9;
  return Math.max(0, end - start);
}

/**
 * Compare two instances: negative if `a` is better than `b`.
 * Order: non-SWF → mp4-like URL → source list → frame_start 1 → frame_end -1 / shorter clip → split (weak).
 * @param {object} a
 * @param {object} b
 * @returns {number}
 */
function compareInstances(a, b) {
  const swfA = isSwf(a.url);
  const swfB = isSwf(b.url);
  if (swfA !== swfB) return swfA ? 1 : -1;

  const mp4A = isMp4(a.url);
  const mp4B = isMp4(b.url);
  if (mp4A !== mp4B) return Number(mp4B) - Number(mp4A);

  const ra = sourceRank(a.source);
  const rb = sourceRank(b.source);
  if (ra !== rb) return ra - rb;

  const fsA = a.frame_start === 1 ? 0 : 1;
  const fsB = b.frame_start === 1 ? 0 : 1;
  if (fsA !== fsB) return fsA - fsB;

  const feA = a.frame_end === -1 ? 0 : 1;
  const feB = b.frame_end === -1 ? 0 : 1;
  if (feA !== feB) return feA - feB;

  if (a.frame_end !== -1 && b.frame_end !== -1) {
    const lenA = clipLength(a);
    const lenB = clipLength(b);
    if (lenA !== lenB) return lenA - lenB;
  }

  const sa = SPLIT_ORDER[a.split] ?? 99;
  const sb = SPLIT_ORDER[b.split] ?? 99;
  return sa - sb;
}

/**
 * @param {object[]} instances
 * @returns {object | null}
 */
function choosePrimaryVideo(instances) {
  if (!Array.isArray(instances) || instances.length === 0) return null;
  const sorted = [...instances].sort(compareInstances);
  return sorted[0];
}

/**
 * Parse `wlasl_class_list.txt`: each line `labelId<TAB>word`
 * @param {string} text
 * @returns {Map<number, string>}
 */
function parseClassList(text) {
  const map = new Map();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith("#")) continue;
    const tab = line.indexOf("\t");
    if (tab === -1) {
      console.warn(`[class list] line ${i + 1}: no tab, skipped: ${line.slice(0, 80)}`);
      continue;
    }
    const idStr = line.slice(0, tab).trim();
    const word = line.slice(tab + 1).trim();
    const labelId = parseInt(idStr, 10);
    if (Number.isNaN(labelId)) {
      console.warn(`[class list] line ${i + 1}: bad label id "${idStr}"`);
      continue;
    }
    if (map.has(labelId)) {
      console.warn(`[class list] duplicate labelId ${labelId}, overwriting`);
    }
    map.set(labelId, word);
  }
  return map;
}

/**
 * Build gloss -> entry map (case-insensitive key).
 * @param {object[]} wlaslArray
 * @returns {Map<string, object>}
 */
function indexByGloss(wlaslArray) {
  const idx = new Map();
  for (const entry of wlaslArray) {
    if (!entry || typeof entry.gloss !== "string") continue;
    const key = entry.gloss.toLowerCase();
    if (idx.has(key)) {
      console.warn(`[WLASL] duplicate gloss key "${key}", keeping last`);
    }
    idx.set(key, entry);
  }
  return idx;
}

/**
 * @param {string} word class-list word (original casing preserved in output where used)
 * @param {number} labelId
 * @param {string} gloss WLASL gloss string
 * @param {object} inst chosen instance (no url written)
 */
function buildRecord(word, labelId, gloss, inst) {
  const vid = inst.video_id;
  const docId = normalizeWord(word) || "unknown";
  const storagePath = getStoragePath(vid);
  const now = new Date().toISOString();
  return {
    docId,
    word,
    labelId,
    gloss,
    videoId: String(vid ?? ""),
    storagePath,
    /** Same object as storagePath; kept for tooling that expects `videoPath`. */
    videoPath: storagePath,
    videoUrl: "",
    /** WLASL / dataset host for the chosen clip (not the same as "contentSource"). */
    source: inst.source ?? "",
    frameStart: inst.frame_start,
    frameEnd: inst.frame_end,
    fps: inst.fps,
    searchTerms: [word],
    isActive: true,
    isCommunity: false,
    definition: "",
    howToSign: "",
    notes: "",
    status: "draft",
    /** Provenance for editorial fields (fill via admin / scripts / dictionary API). */
    contentSource: {
      definition: "pending",
      signNotes: "pending",
    },
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  let classText;
  let wlaslRaw;

  try {
    classText = fs.readFileSync(PATH_CLASS_LIST, "utf8");
  } catch (e) {
    console.error(`Failed to read class list: ${PATH_CLASS_LIST}`, e.message);
    process.exit(1);
  }

  try {
    wlaslRaw = fs.readFileSync(PATH_WLASL, "utf8");
  } catch (e) {
    console.error(`Failed to read WLASL JSON: ${PATH_WLASL}`, e.message);
    process.exit(1);
  }

  /** @type {object[]} */
  let wlaslArray;
  try {
    wlaslArray = JSON.parse(wlaslRaw);
    if (!Array.isArray(wlaslArray)) {
      throw new Error("WLASL JSON must be a top-level array");
    }
  } catch (e) {
    console.error("Failed to parse WLASL JSON:", e.message);
    process.exit(1);
  }

  const labelToWord = parseClassList(classText);
  const glossIndex = indexByGloss(wlaslArray);

  const records = [];
  const unmatched = [];

  for (const [labelId, word] of [...labelToWord.entries()].sort((a, b) => a[0] - b[0])) {
    const key = word.toLowerCase();
    const entry = glossIndex.get(key);

    if (!entry) {
      unmatched.push({ labelId, word, reason: "no WLASL gloss match" });
      continue;
    }

    const instances = entry.instances;
    if (!Array.isArray(instances) || instances.length === 0) {
      unmatched.push({ labelId, word, gloss: entry.gloss, reason: "no instances" });
      continue;
    }

    const selected = choosePrimaryVideo(instances);
    if (!selected) {
      unmatched.push({ labelId, word, gloss: entry.gloss, reason: "could not choose primary instance" });
      continue;
    }

    const gloss = entry.gloss;
    records.push(buildRecord(word, labelId, gloss, selected));
  }

  try {
    fs.writeFileSync(PATH_OUT_RECORDS, JSON.stringify(records, null, 2) + "\n", "utf8");
    fs.writeFileSync(PATH_OUT_UNMATCHED, JSON.stringify(unmatched, null, 2) + "\n", "utf8");
  } catch (e) {
    console.error("Failed to write output files:", e.message);
    process.exit(1);
  }

  const totalClass = labelToWord.size;
  const matched = records.length;
  const unmatchedCount = unmatched.length;

  console.log("---");
  console.log("WLASL class list → Firestore records");
  console.log(`  Total class words:   ${totalClass}`);
  console.log(`  Matched words:       ${matched}`);
  console.log(`  Unmatched words:     ${unmatchedCount}`);
  console.log(`  Output records:      ${PATH_OUT_RECORDS}`);
  console.log(`  Output unmatched:    ${PATH_OUT_UNMATCHED}`);
  console.log("---");
}

main();
