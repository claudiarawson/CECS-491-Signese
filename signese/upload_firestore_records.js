/**
 * upload_firestore_records.js
 *
 * Reads ./firestore_dictionarySigns.json (next to this script) and uploads each
 * record to Firestore collection "dictionarySigns".
 *
 * Usage (from the signese directory):
 *   node upload_firestore_records.js
 *
 * Prerequisites:
 *   npm install firebase-admin
 *   Credentials (first match wins):
 *   1) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (e.g. from .env.local)
 *   2) FIREBASE_SERVICE_ACCOUNT_PATH → path to .json or .js
 *   3) serviceAccountKey.js / serviceAccountKey.json next to this script
 */

"use strict";

const fs = require("fs");
const path = require("path");

const admin = require("firebase-admin");

// ---------------------------------------------------------------------------
// Configuration (edit SERVICE_ACCOUNT_KEY_PATH for your machine)
// ---------------------------------------------------------------------------

/** Default credential files (same folder as this script). */
const SERVICE_ACCOUNT_KEY_JS = path.join(__dirname, "serviceAccountKey.js");
const SERVICE_ACCOUNT_KEY_JSON = path.join(__dirname, "serviceAccountKey.json");

/**
 * Explicit override: path to .json or .js service account file.
 * If unset, tries serviceAccountKey.js first, then serviceAccountKey.json.
 */
const SERVICE_ACCOUNT_KEY_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  ? path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
  : null;

/** Input JSON: same folder as this script (equivalent to ./firestore_dictionarySigns.json when run from signese). */
const INPUT_JSON = path.join(__dirname, "firestore_dictionarySigns.json");

/** Firestore collection id. */
const COLLECTION_NAME = "dictionarySigns";

/** Firestore allows at most 500 writes per batch commit. */
const BATCH_SIZE = 500;

/** merge: true — merge fields into existing documents; safe for re-runs. */
const SET_OPTIONS = { merge: true };

/** Emit a progress line each time this many records have been handled (success + failure). */
const PROGRESS_INTERVAL = 50;

// ---------------------------------------------------------------------------
// Firebase Admin: load credentials and return Firestore instance
// ---------------------------------------------------------------------------

/**
 * Loads signese/.env.local and repo-root ../.env.local into process.env (does not override existing vars).
 */
function loadEnvLocalFiles() {
  const paths = [path.join(__dirname, ".env.local"), path.join(__dirname, "..", ".env.local")];
  for (const filePath of paths) {
    if (!fs.existsSync(filePath)) continue;
    let raw = fs.readFileSync(filePath, "utf8");
    if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1).replace(/\\n/g, "\n").replace(/\\"/g, '"');
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

/**
 * Build service account from env (same pattern as lib/firebase-admin.ts).
 * @returns {object | null}
 */
function tryLoadServiceAccountFromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, "\n");
  return {
    type: "service_account",
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
  };
}

/**
 * @param {object} account
 * @param {string} sourceLabel
 */
function assertPrivateKeyLooksReal(account, sourceLabel) {
  const pk = account.private_key;
  if (typeof pk !== "string" || pk.length < 200) {
    throw new Error(
      `${sourceLabel}: private_key is missing or too short. Paste the full key from the Firebase JSON download.`
    );
  }
  if (/FIREBASE_PRIVATE_KEY|PASTE_|YOUR_PROJECT/i.test(pk)) {
    throw new Error(
      `${sourceLabel}: private_key still contains placeholder text. Replace the whole file with the downloaded service account JSON.`
    );
  }
}

function loadServiceAccountFromFile() {
  /** @param {string} filePath */
  function loadJs(filePath) {
    try {
      const resolved = path.resolve(filePath);
      delete require.cache[resolved];
      return require(resolved);
    } catch (err) {
      throw new Error(`Failed to load service account module ${filePath}: ${err.message}`);
    }
  }

  /** @param {string} filePath */
  function loadJson(filePath) {
    let raw;
    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      throw new Error(`Could not read service account file: ${err.message}`);
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON in service account file: ${err.message}`);
    }
  }

  if (SERVICE_ACCOUNT_KEY_PATH) {
    const p = SERVICE_ACCOUNT_KEY_PATH;
    if (p.endsWith(".js")) {
      const acc = loadJs(p);
      assertPrivateKeyLooksReal(acc, p);
      return acc;
    }
    if (!fs.existsSync(p)) {
      throw new Error(`Service account file not found: ${p}`);
    }
    const acc = loadJson(p);
    assertPrivateKeyLooksReal(acc, p);
    return acc;
  }

  if (fs.existsSync(SERVICE_ACCOUNT_KEY_JS)) {
    const acc = loadJs(SERVICE_ACCOUNT_KEY_JS);
    assertPrivateKeyLooksReal(acc, SERVICE_ACCOUNT_KEY_JS);
    return acc;
  }
  if (fs.existsSync(SERVICE_ACCOUNT_KEY_JSON)) {
    const acc = loadJson(SERVICE_ACCOUNT_KEY_JSON);
    assertPrivateKeyLooksReal(acc, SERVICE_ACCOUNT_KEY_JSON);
    return acc;
  }

  throw new Error(
    `No credentials found. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY\n` +
      `(e.g. in repo-root .env.local), or add one of:\n` +
      `  - ${SERVICE_ACCOUNT_KEY_JS}\n` +
      `  - ${SERVICE_ACCOUNT_KEY_JSON}\n` +
      `Or set FIREBASE_SERVICE_ACCOUNT_PATH to your key file.\n` +
      `Firebase Console → Project settings → Service accounts → Generate new private key.`
  );
}

/**
 * Prefer env-based credentials (matches Expo / lib/firebase-admin.ts), then key files.
 * @returns {object}
 */
function loadServiceAccount() {
  const fromEnv = tryLoadServiceAccountFromEnv();
  if (fromEnv) {
    assertPrivateKeyLooksReal(fromEnv, "environment (FIREBASE_PRIVATE_KEY)");
    return fromEnv;
  }
  return loadServiceAccountFromFile();
}

/**
 * Fix private_key when copied from .env (literal backslash-n instead of newlines).
 * Also repairs a common typo: `-----BEGIN PRIVATE KEY-----\` + base64 (missing `n` after `\`).
 * @param {object} account
 */
function normalizeServiceAccountPrivateKey(account) {
  if (!account || typeof account.private_key !== "string") return;
  let key = account.private_key;
  if (key.includes("\\n")) {
    key = key.replace(/\\n/g, "\n");
  }
  // Typo: "\M" instead of newline after BEGIN line (broken \n in .env)
  key = key.replace(
    /-----BEGIN PRIVATE KEY-----\\(?=[A-Za-z0-9+/=])/,
    "-----BEGIN PRIVATE KEY-----\n"
  );
  account.private_key = key;
}

function initializeFirestore() {
  const serviceAccount = loadServiceAccount();
  normalizeServiceAccountPrivateKey(serviceAccount);
  const credential = admin.credential.cert(serviceAccount);
  if (admin.apps.length === 0) {
    admin.initializeApp({ credential });
  }
  return admin.firestore();
}

/**
 * Document body: everything except docId (docId is only the Firestore document id).
 * @param {object} record
 */
function recordToDocumentData(record) {
  if (!record || typeof record !== "object") {
    throw new Error("Record must be a non-null object");
  }
  const { docId, ...rest } = record;
  return rest;
}

async function commitBatch(batch) {
  await batch.commit();
}

/**
 * Log when the cumulative handled count crosses each multiple of PROGRESS_INTERVAL.
 */
function maybePrintProgress(prevTotal, newTotal, recordsLength, uploaded, failed) {
  for (let m = PROGRESS_INTERVAL; m <= newTotal; m += PROGRESS_INTERVAL) {
    if (m > prevTotal && m <= newTotal) {
      console.log(
        `Progress: ${m} / ${recordsLength} records handled (uploaded=${uploaded}, failed=${failed})`
      );
    }
  }
}

/**
 * If a whole batch commit fails, retry each write alone so partial success is possible.
 */
async function uploadSliceIndividually(db, recordsSlice, failedReason) {
  console.warn(`Batch failed (${failedReason}). Retrying ${recordsSlice.length} record(s) individually...`);
  let ok = 0;
  let fail = 0;
  for (const rec of recordsSlice) {
    const id = rec.docId;
    if (id === undefined || id === null || String(id).trim() === "") {
      console.error("Skipping record with missing docId:", rec);
      fail += 1;
      continue;
    }
    try {
      const ref = db.collection(COLLECTION_NAME).doc(String(id));
      await ref.set(recordToDocumentData(rec), SET_OPTIONS);
      ok += 1;
    } catch (e) {
      console.error(`Failed document id="${id}":`, e.message || e);
      fail += 1;
    }
  }
  return { ok, fail };
}

async function main() {
  loadEnvLocalFiles();

  let db;
  try {
    db = initializeFirestore();
  } catch (e) {
    console.error("Failed to initialize Firestore:", e.message || e);
    process.exitCode = 1;
    return;
  }

  let records;
  try {
    const raw = fs.readFileSync(INPUT_JSON, "utf8");
    records = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to read or parse ${INPUT_JSON}:`, e.message || e);
    process.exitCode = 1;
    return;
  }

  if (!Array.isArray(records)) {
    console.error("Expected JSON root to be an array of records.");
    process.exitCode = 1;
    return;
  }

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const slice = records.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    const validSlice = [];

    for (const record of slice) {
      const docId = record && record.docId;
      if (docId === undefined || docId === null || String(docId).trim() === "") {
        console.error("Skipping record without docId at batch offset:", i);
        const prevTotal = uploaded + failed;
        failed += 1;
        maybePrintProgress(prevTotal, uploaded + failed, records.length, uploaded, failed);
        continue;
      }
      const ref = db.collection(COLLECTION_NAME).doc(String(docId));
      let data;
      try {
        data = recordToDocumentData(record);
      } catch (e) {
        console.error(`Invalid record for docId=${docId}:`, e.message || e);
        const prevTotal = uploaded + failed;
        failed += 1;
        maybePrintProgress(prevTotal, uploaded + failed, records.length, uploaded, failed);
        continue;
      }
      batch.set(ref, data, SET_OPTIONS);
      validSlice.push(record);
    }

    if (validSlice.length === 0) {
      continue;
    }

    const prevTotalBeforeOp = uploaded + failed;
    try {
      await commitBatch(batch);
      uploaded += validSlice.length;
      maybePrintProgress(prevTotalBeforeOp, uploaded + failed, records.length, uploaded, failed);
    } catch (err) {
      const msg = err.message || String(err);
      console.error("Batch commit failed:", msg);
      const { ok, fail } = await uploadSliceIndividually(db, validSlice, msg);
      uploaded += ok;
      failed += fail;
      maybePrintProgress(prevTotalBeforeOp, uploaded + failed, records.length, uploaded, failed);
    }
  }

  console.log("--- Summary ---");
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Failed:   ${failed}`);
  console.log(`Total:    ${records.length}`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error("Unexpected error:", e);
  process.exitCode = 1;
});
