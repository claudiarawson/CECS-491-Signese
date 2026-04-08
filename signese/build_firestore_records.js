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
 *   ./category_review.json  (word → categories for QA)
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
const PATH_CATEGORY_REVIEW = path.join(ROOT, "category_review.json");

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
// App-friendly categories (expand lists below as the app grows)
// ---------------------------------------------------------------------------

/** Stable sort order for Firestore + UI. */
const CATEGORY_ORDER = [
  "action",
  "object",
  "person",
  "descriptor",
  "time",
  "place",
  "emotion",
  "question",
  "function",
  "social",
  "number",
];

// --- Explicit word lists (lowercase keys; phrases use spaces) ----------------

const QUESTION_WORDS = new Set([
  "who",
  "what",
  "why",
  "where",
  "when",
  "how",
  "which",
  "whose",
  "whom",
]);

const SOCIAL_WORDS = new Set([
  "thank you",
  "thanks",
  "sorry",
  "please",
  "hello",
  "goodbye",
  "bye",
  "welcome",
  "excuse me",
]);

const FUNCTION_WORDS = new Set([
  "and",
  "but",
  "if",
  "for",
  "with",
  "because",
  "not",
  "yes",
  "no",
  "to",
  "from",
  "on",
  "in",
  "out",
  "under",
  "over",
  "until",
  "again",
  "also",
  "about",
  "or",
  "so",
  "then",
  "than",
  "as",
  "at",
  "by",
  "of",
  "off",
  "up",
  "down",
  "into",
  "onto",
  "after",
  "before",
  "between",
  "without",
  "during",
  "while",
  "although",
  "since",
  "unless",
  "however",
]);

const TIME_WORDS = new Set([
  "today",
  "tomorrow",
  "yesterday",
  "morning",
  "afternoon",
  "night",
  "evening",
  "noon",
  "midnight",
  "minute",
  "hour",
  "day",
  "week",
  "weekend",
  "month",
  "year",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
  "now",
  "soon",
  "later",
  "early",
  "late",
  "spring",
  "summer",
  "fall",
  "winter",
  "autumn",
]);

const EMOTION_WORDS = new Set([
  "happy",
  "sad",
  "angry",
  "excited",
  "tired",
  "scared",
  "jealous",
  "hurt",
  "nervous",
  "upset",
  "surprise",
  "surprised",
  "worried",
  "proud",
  "embarrassed",
  "lonely",
  "bored",
  "confused",
  "disappointed",
  "frustrated",
  "calm",
  "relaxed",
  "love",
  "hate",
  "like",
  "dislike",
]);

const PERSON_WORDS = new Set([
  "mother",
  "father",
  "mom",
  "dad",
  "brother",
  "sister",
  "son",
  "daughter",
  "uncle",
  "aunt",
  "grandmother",
  "grandfather",
  "grandma",
  "grandpa",
  "cousin",
  "friend",
  "teacher",
  "student",
  "doctor",
  "nurse",
  "police",
  "president",
  "husband",
  "wife",
  "man",
  "woman",
  "boy",
  "girl",
  "person",
  "people",
  "neighbor",
  "baby",
  "child",
  "children",
  "kid",
  "family",
  "parent",
  "parents",
]);

const PLACE_WORDS = new Set([
  "home",
  "school",
  "college",
  "university",
  "restaurant",
  "office",
  "hospital",
  "room",
  "bathroom",
  "kitchen",
  "bedroom",
  "library",
  "church",
  "store",
  "town",
  "city",
  "country",
  "africa",
  "america",
  "canada",
  "california",
  "japan",
  "england",
  "europe",
  "house",
  "apartment",
  "basement",
  "classroom",
  "park",
  "work",
  "outside",
  "inside",
]);

const NUMBER_WORDS = new Set([
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "twenty",
  "hundred",
  "thousand",
  "million",
  "many",
  "most",
  "more",
  "some",
  "all",
  "none",
  "few",
  "both",
  "several",
  "percent",
  "total",
  "half",
  "first",
  "second",
  "third",
  "last",
  "next",
  "another",
]);

const DESCRIPTOR_WORDS = new Set([
  "big",
  "small",
  "large",
  "little",
  "huge",
  "tiny",
  "tall",
  "short",
  "long",
  "wide",
  "narrow",
  "thick",
  "thin",
  "heavy",
  "light",
  "hot",
  "cold",
  "warm",
  "cool",
  "fast",
  "slow",
  "new",
  "old",
  "young",
  "good",
  "bad",
  "better",
  "best",
  "worst",
  "easy",
  "hard",
  "difficult",
  "same",
  "different",
  "other",
  "full",
  "empty",
  "clean",
  "dirty",
  "wet",
  "dry",
  "soft",
  "hard",
  "loud",
  "quiet",
  "bright",
  "dark",
  "pretty",
  "ugly",
  "beautiful",
  "cute",
  "smart",
  "stupid",
  "rich",
  "poor",
  "real",
  "fake",
  "right",
  "wrong",
  "true",
  "false",
  "ready",
  "sure",
  "maybe",
  "important",
  "special",
  "whole",
  "main",
]);

const ACTION_WORDS = new Set([
  "run",
  "walk",
  "jump",
  "eat",
  "drink",
  "sleep",
  "wake",
  "go",
  "come",
  "see",
  "look",
  "watch",
  "listen",
  "hear",
  "speak",
  "talk",
  "say",
  "tell",
  "ask",
  "answer",
  "read",
  "write",
  "draw",
  "play",
  "work",
  "study",
  "learn",
  "teach",
  "help",
  "give",
  "take",
  "get",
  "put",
  "make",
  "do",
  "did",
  "done",
  "sit",
  "stand",
  "lie",
  "wait",
  "stop",
  "start",
  "begin",
  "finish",
  "try",
  "need",
  "want",
  "like",
  "love",
  "hate",
  "buy",
  "sell",
  "pay",
  "open",
  "close",
  "turn",
  "push",
  "pull",
  "throw",
  "catch",
  "cut",
  "cook",
  "wash",
  "clean",
  "drive",
  "fly",
  "swim",
  "dance",
  "sing",
  "laugh",
  "cry",
  "smile",
  "think",
  "know",
  "remember",
  "forget",
  "understand",
  "believe",
  "feel",
  "hope",
  "wish",
  "send",
  "call",
  "meet",
  "leave",
  "arrive",
  "return",
  "visit",
  "travel",
  "move",
  "carry",
  "hold",
  "drop",
  "pick",
  "choose",
  "use",
  "find",
  "lose",
  "win",
  "fight",
  "hit",
  "kick",
  "climb",
  "fall",
  "rise",
  "grow",
  "die",
  "born",
  "fix",
  "break",
  "build",
]);

const OBJECT_WORDS = new Set([
  "book",
  "chair",
  "phone",
  "table",
  "door",
  "window",
  "car",
  "bus",
  "train",
  "plane",
  "boat",
  "bike",
  "computer",
  "paper",
  "pen",
  "pencil",
  "cup",
  "plate",
  "fork",
  "spoon",
  "knife",
  "food",
  "water",
  "milk",
  "bread",
  "money",
  "key",
  "bag",
  "box",
  "ball",
  "toy",
  "bed",
  "lamp",
  "clock",
  "tv",
  "camera",
  "picture",
  "flower",
  "tree",
  "animal",
  "dog",
  "cat",
  "bird",
  "fish",
  "horse",
  "cow",
  "pig",
  "shirt",
  "pants",
  "shoes",
  "hat",
  "coat",
  "dress",
  "glasses",
]);

/**
 * Manual overrides for ambiguous or multi-label words (normalized key → categories).
 * Checked first; takes precedence over set union.
 */
const CATEGORY_OVERRIDES = {
  "thank you": ["social"],
  "sorry": ["social"],
  "please": ["social"],
  "who": ["question"],
  "what": ["question"],
  "why": ["question"],
  "where": ["question"],
  "when": ["question"],
  "how": ["question"],
  "happy": ["descriptor", "emotion"],
  "sad": ["descriptor", "emotion"],
  "angry": ["descriptor", "emotion"],
  "school": ["place"],
  "home": ["place"],
  "restaurant": ["place"],
  "mother": ["person"],
  "teacher": ["person"],
  "doctor": ["person"],
  "book": ["object"],
  "chair": ["object"],
  "phone": ["object"],
  "go": ["action"],
  "run": ["action"],
  "eat": ["action"],
  "drink": ["action"],
  "yesterday": ["time"],
  "today": ["time"],
  "tomorrow": ["time"],
  "one": ["number"],
  "two": ["number"],
  "three": ["number"],
  "many": ["number", "descriptor"],
  all: ["number", "function"],
  yes: ["function"],
  no: ["function"],
};

/** Maps category id → Set of normalized words */
const CATEGORY_SETS = [
  ["action", ACTION_WORDS],
  ["object", OBJECT_WORDS],
  ["person", PERSON_WORDS],
  ["descriptor", DESCRIPTOR_WORDS],
  ["time", TIME_WORDS],
  ["place", PLACE_WORDS],
  ["emotion", EMOTION_WORDS],
  ["question", QUESTION_WORDS],
  ["function", FUNCTION_WORDS],
  ["social", SOCIAL_WORDS],
  ["number", NUMBER_WORDS],
];

// --- Fallback helpers (when word matches no override and no explicit set) ----

const FALLBACK_QUESTION = new Set(["who", "what", "why", "where", "when", "how", "which"]);

const FALLBACK_FUNCTION = new Set([
  "and",
  "but",
  "if",
  "for",
  "with",
  "because",
  "not",
  "yes",
  "no",
  "or",
  "so",
  "the",
  "a",
  "an",
]);

/** Extra time-like tokens for substring / suffix heuristics */
const TIME_SUFFIX_HINTS = [
  "day",
  "night",
  "week",
  "month",
  "year",
  "morning",
  "afternoon",
  "evening",
  "noon",
  "time",
  "clock",
  "today",
  "tomorrow",
  "yesterday",
];

const MONTH_DAY_PREFIXES = [
  "mon",
  "tues",
  "wed",
  "thurs",
  "fri",
  "sat",
  "sun",
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/** Emotion-like stems for fallback (not already in EMOTION_WORDS) */
const EMOTION_FALLBACK = new Set([
  "glad",
  "mad",
  "fear",
  "joy",
  "grief",
  "shame",
  "guilt",
  "hopeful",
  "hopeless",
  "angry",
  "happiness",
  "sadness",
]);

/** Person / role suffixes for rough heuristic */
const PERSON_SUFFIXES = ["mother", "father", "parent", "teacher", "doctor", "student", "friend", "neighbor", "boss", "worker", "nurse", "driver", "officer"];

// ---------------------------------------------------------------------------
// categorizeWord
// ---------------------------------------------------------------------------

/**
 * Normalize for lookup: lowercase, trim, collapse internal whitespace.
 * @param {string} word
 * @returns {string}
 */
function normalizeForCategory(word) {
  if (typeof word !== "string") return "";
  return word
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * @param {string} key normalized
 * @returns {boolean}
 */
function looksLikeTimeWord(key) {
  if (TIME_WORDS.has(key)) return true;
  for (const d of MONTH_DAY_PREFIXES) {
    if (key.startsWith(d) && key.length <= 12) return true;
  }
  for (const h of TIME_SUFFIX_HINTS) {
    if (key === h || key.endsWith(h)) return true;
  }
  if (/^(sun|mon|tues|wed|thurs|fri|sat)(day)?$/.test(key)) return true;
  return false;
}

/** Common -ing words that are not feelings (avoid false "emotion" tags). */
const NOT_EMOTION_ING = new Set([
  "morning",
  "evening",
  "nothing",
  "something",
  "anything",
  "everything",
  "bring",
  "sing",
  "ring",
  "spring",
  "ceiling",
  "building",
  "training",
  "running",
  "wedding",
  "reading",
  "meaning",
]);

/**
 * @param {string} key normalized
 * @returns {boolean}
 */
function looksLikeEmotionWord(key) {
  if (EMOTION_WORDS.has(key) || EMOTION_FALLBACK.has(key)) return true;
  if (/(ful|ous)$/.test(key) && key.length > 4) return true;
  if (/(ous|ive)$/.test(key) && key.length > 5) return true;
  if (key.endsWith("ed") && key.length > 5) return true;
  if (key.endsWith("ing") && key.length > 5 && !NOT_EMOTION_ING.has(key)) return true;
  return false;
}

/**
 * @param {string} key normalized
 * @returns {boolean}
 */
function looksLikePersonWord(key) {
  if (PERSON_WORDS.has(key)) return true;
  for (const s of PERSON_SUFFIXES) {
    if (key.endsWith(s) && key.length > s.length) return true;
  }
  if (/(man|woman|boy|girl|people|person|baby|child|children)$/.test(key)) return true;
  return false;
}

/**
 * Internal: full categorization with metadata for reporting.
 * @param {string} word raw word from class list (any casing)
 * @returns {{ categories: string[], usedDefaultObject: boolean }}
 */
function categorizeWordInternal(word) {
  const key = normalizeForCategory(word);
  if (!key) {
    return { categories: ["object"], usedDefaultObject: true };
  }

  if (Object.prototype.hasOwnProperty.call(CATEGORY_OVERRIDES, key)) {
    const cats = [...CATEGORY_OVERRIDES[key]];
    return { categories: sortCategories(cats), usedDefaultObject: false };
  }

  const found = new Set();
  for (const [catId, set] of CATEGORY_SETS) {
    if (set.has(key)) found.add(catId);
  }

  if (found.size > 0) {
    return { categories: sortCategories([...found]), usedDefaultObject: false };
  }

  // --- Fallback chain (no explicit list hit) ---
  if (FALLBACK_QUESTION.has(key)) {
    return { categories: ["question"], usedDefaultObject: false };
  }
  if (FALLBACK_FUNCTION.has(key)) {
    return { categories: ["function"], usedDefaultObject: false };
  }
  if (looksLikeTimeWord(key)) {
    return { categories: ["time"], usedDefaultObject: false };
  }
  if (looksLikeEmotionWord(key)) {
    return { categories: sortCategories(["emotion", "descriptor"]), usedDefaultObject: false };
  }
  if (looksLikePersonWord(key)) {
    return { categories: ["person"], usedDefaultObject: false };
  }

  return { categories: ["object"], usedDefaultObject: true };
}

/**
 * Returns one or more app-friendly categories for a dictionary word.
 * @param {string} word
 * @returns {string[]}
 */
function categorizeWord(word) {
  return categorizeWordInternal(word).categories;
}

/**
 * @param {string[]} cats
 * @returns {string[]}
 */
function sortCategories(cats) {
  const uniq = [...new Set(cats)];
  uniq.sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  return uniq;
}

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
  const categories = categorizeWord(word);
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
    categories,
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
  /** @type {{ word: string, categories: string[] }[]} */
  const categoryReview = [];

  /** @type {Record<string, number>} */
  const categoryTotals = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0]));
  let multiCategoryWords = 0;
  let defaultObjectFallbackWords = 0;
  /** @type {string[]} */
  const defaultObjectWordSamples = [];

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
    const rec = buildRecord(word, labelId, gloss, selected);
    records.push(rec);

    const { categories, usedDefaultObject } = categorizeWordInternal(word);
    categoryReview.push({ word, categories });

    if (categories.length > 1) multiCategoryWords += 1;
    if (usedDefaultObject) {
      defaultObjectFallbackWords += 1;
      if (defaultObjectWordSamples.length < 40) defaultObjectWordSamples.push(word);
    }
    for (const c of categories) {
      if (categoryTotals[c] !== undefined) categoryTotals[c] += 1;
    }
  }

  try {
    fs.writeFileSync(PATH_OUT_RECORDS, JSON.stringify(records, null, 2) + "\n", "utf8");
    fs.writeFileSync(PATH_OUT_UNMATCHED, JSON.stringify(unmatched, null, 2) + "\n", "utf8");
    fs.writeFileSync(PATH_CATEGORY_REVIEW, JSON.stringify(categoryReview, null, 2) + "\n", "utf8");
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
  console.log(`  Category review:     ${PATH_CATEGORY_REVIEW}`);
  console.log("---");
  console.log("Category summary (counts = times a word is tagged with that category):");
  for (const c of CATEGORY_ORDER) {
    console.log(`  ${c.padEnd(12)} ${categoryTotals[c]}`);
  }
  console.log(`  Words with 2+ categories: ${multiCategoryWords}`);
  console.log(`  Default ["object"] fallback: ${defaultObjectFallbackWords}`);
  if (defaultObjectWordSamples.length > 0) {
    console.log(`  Sample default-object words (up to 40): ${defaultObjectWordSamples.join(", ")}`);
  }
  console.log("---");
}

main();
