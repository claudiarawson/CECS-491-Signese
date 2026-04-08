export type LabelCategory = "alphabet" | "number" | "greeting";

export type LabelId = string;

export type ManifestGroupKey = "alphabet" | "numbers" | "greetings_intro" | string;

export type ManifestLabelStatus =
	| "candidate"
	| "confirmed_in_dataset"
	| "needs_alt_dataset"
	| "needs_custom_recording"
	| "excluded"
	| string;

export interface ManifestLabelEntry {
	label: LabelId;
	group: ManifestGroupKey;
	source_dataset: string | null;
	source_gloss: string | null;
	status: ManifestLabelStatus;
	include: boolean;
	notes?: string;
}

export interface ComposedPhraseDefinition {
	phrase: string;
	from_labels: LabelId[];
	train_as_single_label: boolean;
	notes?: string;
}

export interface DatasetVocabularyManifest {
	version: string;
	project: string;
	task: string;
	description?: string;
	notes?: string[];
	label_groups: Record<ManifestGroupKey, ManifestLabelEntry[]>;
	composed_phrases: ComposedPhraseDefinition[];
	status_legend?: Record<string, string>;
}

export interface LabelDefinition {
	id: LabelId;
	category: LabelCategory;
	display?: string;
	aliases?: string[];
}

export interface DatasetSource {
	id: string;
	name: string;
	version?: string;
	splitStrategy?: string;
	notes?: string;
}

export interface DatasetSplitConfig {
	train: number;
	validation: number;
	test: number;
}

export interface DatasetManifest {
	schemaVersion: string;
	createdAt: string;
	vocabularyName: string;
	labels: LabelDefinition[];
	sources: DatasetSource[];
	split: DatasetSplitConfig;
}

export interface ClipFrame {
	frameId: string;
	timestampMs: number;
	width: number;
	height: number;
	uri?: string;
}

export interface TemporalClip {
	clipId: string;
	startMs: number;
	endMs: number;
	fps: number;
	frames: ClipFrame[];
}

export interface NormalizedModelInput {
	clipId: string;
	values: number[];
	shape: [number, number, number, number];
	metadata: {
		sourceClipFps: number;
		sampledFrames: number;
	};
}

export interface LabelScore {
	label: LabelId;
	score: number;
}

export interface ModelPrediction {
	clipId: string;
	modelId: string;
	inferenceMs: number;
	createdAtMs: number;
	scores: LabelScore[];
}

export interface CaptionToken {
	id: string;
	label: string;
	source: "single" | "ambiguous";
	alternatives?: [LabelId, LabelId];
	confidence: number;
	timestampMs: number;
	rawTopK: LabelScore[];
}

export interface PostprocessConfig {
	emaAlpha: number;
	minConfidence: number;
	ambiguityGap: number;
	duplicateCooldownMs: number;
	topK: number;
}

export interface PostprocessDecision {
	token?: CaptionToken;
	smoothedScores: LabelScore[];
	reason: "accepted" | "below-threshold" | "duplicate-suppressed";
}

export interface InferenceAdapter {
	name: string;
	predict(input: NormalizedModelInput): Promise<ModelPrediction>;
}

export interface ClipPreprocessor {
	name: string;
	preprocess(clip: TemporalClip): Promise<NormalizedModelInput>;
}

export interface ClipSamplerConfig {
	clipLengthFrames: number;
	sampleEveryMs: number;
	targetFps: number;
}

export interface TrainingSampleRecord {
	sampleId: string;
	label: LabelId;
	datasetSourceId: string;
	split: "train" | "validation" | "test";
	clipPath: string;
	frameCount: number;
	durationMs: number;
	fps: number;
}
