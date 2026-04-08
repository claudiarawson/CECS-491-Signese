import {
  getComposedPhraseDefinitions,
  getLabelsByGroup,
  getRuntimeLabels,
  getTrainableLabels,
  loadDatasetManifest,
} from "./manifest";

export const DATASET_MANIFEST_V0 = loadDatasetManifest();

export const RUNTIME_V0_LABELS = getRuntimeLabels(DATASET_MANIFEST_V0);
export const TRAINABLE_V0_LABELS = getTrainableLabels(DATASET_MANIFEST_V0);
export const COMPOSED_V0_PHRASES = getComposedPhraseDefinitions(DATASET_MANIFEST_V0);

export const GREETING_INTRO_V0_LABELS = getLabelsByGroup(
  "greetings_intro",
  DATASET_MANIFEST_V0
).map((entry) => entry.label);

export const RUNTIME_V0_LABEL_INDEX = new Set(RUNTIME_V0_LABELS);

