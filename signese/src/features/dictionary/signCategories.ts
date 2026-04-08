/**
 * App-facing sign categories (matches `build_firestore_records.js` / Firestore `categories` array).
 * Short labels are for compact chips on cards; full names for filter row.
 */

import type { SignCategoryId } from "./types";

export const SIGN_CATEGORY_ORDER: readonly SignCategoryId[] = [
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
] as const;

/** Filter chip + card tag: short readable label */
export const SIGN_CATEGORY_LABEL: Record<SignCategoryId, string> = {
  action: "Verbs",
  object: "Things",
  person: "People",
  descriptor: "Traits",
  time: "Time",
  place: "Places",
  emotion: "Feelings",
  question: "Questions",
  function: "Grammar",
  social: "Social",
  number: "Numbers",
};

const VALID_IDS = new Set<string>(SIGN_CATEGORY_ORDER);

export function isSignCategoryId(s: string): s is SignCategoryId {
  return VALID_IDS.has(s);
}

/** Normalize Firestore strings into known category ids (drops unknown). */
export function normalizeSignCategories(raw: unknown): SignCategoryId[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: SignCategoryId[] = [];
  for (const x of raw) {
    if (typeof x === "string" && isSignCategoryId(x) && !out.includes(x as SignCategoryId)) {
      out.push(x as SignCategoryId);
    }
  }
  return out.length > 0 ? out : undefined;
}
