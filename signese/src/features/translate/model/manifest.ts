import rawManifest from "./dataset.manifest.json";
import {
  ComposedPhraseDefinition,
  DatasetVocabularyManifest,
  ManifestGroupKey,
  ManifestLabelEntry,
} from "./types";

let manifestCache: DatasetVocabularyManifest | null = null;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLabelEntry(value: unknown): value is ManifestLabelEntry {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.label === "string" &&
    typeof value.group === "string" &&
    typeof value.status === "string" &&
    typeof value.include === "boolean"
  );
}

function isComposedPhrase(value: unknown): value is ComposedPhraseDefinition {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.phrase === "string" &&
    Array.isArray(value.from_labels) &&
    value.from_labels.every((item) => typeof item === "string") &&
    typeof value.train_as_single_label === "boolean"
  );
}

function parseManifest(value: unknown): DatasetVocabularyManifest {
  if (!isObject(value)) {
    throw new Error("Invalid dataset manifest: expected object root.");
  }

  if (!isObject(value.label_groups)) {
    throw new Error("Invalid dataset manifest: label_groups is required.");
  }

  const normalizedGroups: Record<string, ManifestLabelEntry[]> = {};
  for (const [group, entries] of Object.entries(value.label_groups)) {
    if (!Array.isArray(entries) || !entries.every(isLabelEntry)) {
      throw new Error(`Invalid dataset manifest: label_groups.${group} has invalid entries.`);
    }

    normalizedGroups[group] = entries.map((entry) => ({
      ...entry,
      group,
    }));
  }

  if (!Array.isArray(value.composed_phrases) || !value.composed_phrases.every(isComposedPhrase)) {
    throw new Error("Invalid dataset manifest: composed_phrases has invalid entries.");
  }

  const statusLegend = isObject(value.status_legend)
    ? Object.fromEntries(
        Object.entries(value.status_legend).filter(
          (entry): entry is [string, string] => typeof entry[1] === "string"
        )
      )
    : undefined;

  return {
    version: typeof value.version === "string" ? value.version : "0.0",
    project: typeof value.project === "string" ? value.project : "unknown",
    task: typeof value.task === "string" ? value.task : "unknown",
    description: typeof value.description === "string" ? value.description : undefined,
    notes: Array.isArray(value.notes)
      ? value.notes.filter((item): item is string => typeof item === "string")
      : undefined,
    label_groups: normalizedGroups,
    composed_phrases: value.composed_phrases,
    status_legend: statusLegend,
  };
}

export function loadDatasetManifest(): DatasetVocabularyManifest {
  if (manifestCache) {
    return manifestCache;
  }

  manifestCache = parseManifest(rawManifest);
  return manifestCache;
}

export function getAllLabelEntries(manifest = loadDatasetManifest()): ManifestLabelEntry[] {
  return Object.values(manifest.label_groups).flat();
}

export function getIncludedLabelEntries(manifest = loadDatasetManifest()): ManifestLabelEntry[] {
  return getAllLabelEntries(manifest).filter((entry) => entry.include);
}

export function getLabelsByGroup(
  group: ManifestGroupKey,
  manifest = loadDatasetManifest()
): ManifestLabelEntry[] {
  return [...(manifest.label_groups[group] ?? [])];
}

export function getRuntimeLabels(manifest = loadDatasetManifest()): string[] {
  return Array.from(new Set(getIncludedLabelEntries(manifest).map((entry) => entry.label)));
}

export function getComposedPhraseDefinitions(
  manifest = loadDatasetManifest()
): ComposedPhraseDefinition[] {
  return [...manifest.composed_phrases];
}

export function getTrainableLabelEntries(manifest = loadDatasetManifest()): ManifestLabelEntry[] {
  const excludedPhraseLabels = new Set(
    getComposedPhraseDefinitions(manifest)
      .filter((phrase) => phrase.train_as_single_label === false)
      .map((phrase) => phrase.phrase)
  );

  return getIncludedLabelEntries(manifest).filter(
    (entry) => entry.status === "confirmed_in_dataset" && !excludedPhraseLabels.has(entry.label)
  );
}

export function getTrainableLabels(manifest = loadDatasetManifest()): string[] {
  return Array.from(new Set(getTrainableLabelEntries(manifest).map((entry) => entry.label)));
}

// TODO(dataset): Add helper(s) that merge external subset metadata and per-label clip counts.
// TODO(training): Add helper(s) to export split-specific file lists from manifest + subset scripts.
