import { PredictionInterpreter } from "./interpreter";
import { BasicTemporalClipPreprocessor } from "./preprocess";
import { RUNTIME_V0_LABELS } from "./supportedSigns";
import {
	ClipFrame,
	InferenceAdapter,
	LabelId,
	LabelScore,
	ModelPrediction,
	NormalizedModelInput,
	PostprocessDecision,
	TemporalClip,
} from "./types";

const DEFAULT_SCENARIO: LabelId[] = ["HELLO", "MY", "NAME", "NICE", "MEET", "YOU"];

function normalizeScores(scores: LabelScore[]): LabelScore[] {
	const safe = scores.map((item) => ({
		label: item.label,
		score: Math.max(item.score, 0.0001),
	}));
	const total = safe.reduce((sum, item) => sum + item.score, 0);

	return safe
		.map((item) => ({ label: item.label, score: item.score / total }))
		.sort((left, right) => right.score - left.score);
}

export class MockInferenceAdapter implements InferenceAdapter {
	name = "mock-inference-adapter";
	private labels: LabelId[];
	private step = 0;
	private scenario: LabelId[];

	constructor(labels?: LabelId[], scenario?: LabelId[]) {
		this.labels = labels ?? RUNTIME_V0_LABELS;
		this.scenario = scenario ?? DEFAULT_SCENARIO;
	}

	async predict(input: NormalizedModelInput): Promise<ModelPrediction> {
		const startedAt = Date.now();
		const primaryLabel = this.scenario[this.step % this.scenario.length] ?? this.labels[0];
		const ambiguousPair = this.getAmbiguousPair(primaryLabel);

		const rawScores: LabelScore[] = this.labels.map((label) => ({
			label,
			score: 0.01,
		}));

		for (const item of rawScores) {
			if (item.label === primaryLabel) {
				item.score = 0.7;
			}

			if (ambiguousPair && item.label === ambiguousPair) {
				item.score = 0.64;
			}

			if (item.label === this.labels[(this.step + 3) % this.labels.length]) {
				item.score = 0.18;
			}
		}

		this.step += 1;

		return {
			clipId: input.clipId,
			modelId: "mock-signese-mvp-v0",
			inferenceMs: Date.now() - startedAt,
			createdAtMs: Date.now(),
			scores: normalizeScores(rawScores),
		};
	}

	private getAmbiguousPair(primary: LabelId): LabelId | null {
		const ambiguousPairs: Record<string, LabelId> = {
			HELLO: "WELCOME",
			WELCOME: "HELLO",
			NAME: "MY",
			MY: "NAME",
			NICE: "GOOD",
		};

		const next = ambiguousPairs[primary] ?? null;
		if (!next || !this.labels.includes(next)) {
			return null;
		}

		return next;
	}
}

export class LocalModelInferenceAdapter implements InferenceAdapter {
	name = "local-model-inference-adapter";

	async predict(): Promise<ModelPrediction> {
		// TODO(model): Load and run an on-device model (e.g., tfjs/tflite/onnx-runtime-react-native).
		throw new Error("LocalModelInferenceAdapter is not implemented yet.");
	}
}

export class BackendInferenceAdapter implements InferenceAdapter {
	name = "backend-inference-adapter";
	private endpointUrl: string;
	private requestTimeoutMs: number;
	private labels: LabelId[];

	constructor(params: { endpointUrl: string; labels?: LabelId[]; requestTimeoutMs?: number }) {
		this.endpointUrl = params.endpointUrl;
		this.labels = params.labels ?? RUNTIME_V0_LABELS;
		this.requestTimeoutMs = params.requestTimeoutMs ?? 8000;
	}

	async predict(input: NormalizedModelInput): Promise<ModelPrediction> {
		const startedAt = Date.now();
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), this.requestTimeoutMs);

		try {
			const response = await fetch(this.endpointUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					clip_id: input.clipId,
					values: input.values,
					shape: input.shape,
					metadata: input.metadata,
				}),
				signal: controller.signal,
			});

			if (!response.ok) {
				throw new Error(`Backend inference failed with status ${response.status}`);
			}

			const payload: unknown = await response.json();
			const parsed = this.parseBackendPayload(payload);

			return {
				clipId: input.clipId,
				modelId: parsed.modelId,
				inferenceMs: Date.now() - startedAt,
				createdAtMs: Date.now(),
				scores: normalizeScores(parsed.scores),
			};
		} finally {
			clearTimeout(timer);
		}
	}

	private parseBackendPayload(payload: unknown): { modelId: string; scores: LabelScore[] } {
		if (!payload || typeof payload !== "object") {
			throw new Error("Backend inference response must be an object.");
		}

		const obj = payload as Record<string, unknown>;
		const modelId = typeof obj.model_id === "string" ? obj.model_id : "backend-signese-v1";

		// Supported response shapes:
		// 1) { scores: [{ label: "GOOD", score: 0.7 }, ...] }
		// 2) { probabilities: { GOOD: 0.7, NICE: 0.2, ... } }
		const directScores = this.parseDirectScores(obj.scores);
		if (directScores.length > 0) {
			return { modelId, scores: directScores };
		}

		const probabilityScores = this.parseProbabilities(obj.probabilities);
		if (probabilityScores.length > 0) {
			return { modelId, scores: probabilityScores };
		}

		throw new Error("Backend inference response missing valid scores/probabilities.");
	}

	private parseDirectScores(value: unknown): LabelScore[] {
		if (!Array.isArray(value)) {
			return [];
		}

		const rows: LabelScore[] = [];
		for (const item of value) {
			if (!item || typeof item !== "object") {
				continue;
			}
			const row = item as Record<string, unknown>;
			const label = typeof row.label === "string" ? row.label : null;
			const score = typeof row.score === "number" ? row.score : null;
			if (!label || score == null) {
				continue;
			}
			rows.push({ label, score });
		}
		return rows;
	}

	private parseProbabilities(value: unknown): LabelScore[] {
		if (!value || typeof value !== "object") {
			return [];
		}

		const probs = value as Record<string, unknown>;
		const rows: LabelScore[] = [];
		for (const label of this.labels) {
			const score = probs[label];
			if (typeof score !== "number") {
				continue;
			}
			rows.push({ label, score });
		}
		return rows;
	}
}

export interface PipelineResult {
	prediction: ModelPrediction;
	decision: PostprocessDecision;
}

export class SignRecognitionPipeline {
	private preprocessor = new BasicTemporalClipPreprocessor();
	private interpreter = new PredictionInterpreter();

	constructor(private adapter: InferenceAdapter) {}

	async processClip(clip: TemporalClip): Promise<PipelineResult> {
		const modelInput = await this.preprocessor.preprocess(clip);
		const prediction = await this.adapter.predict(modelInput);
		const decision = this.interpreter.apply(prediction);

		return {
			prediction,
			decision,
		};
	}

	reset() {
		this.interpreter.reset();
	}

	getAdapterName() {
		return this.adapter.name;
	}
}

export function createMockTemporalClip(params: {
	sequence: number;
	frameCount?: number;
	fps?: number;
	width?: number;
	height?: number;
}): TemporalClip {
	const frameCount = params.frameCount ?? 12;
	const fps = params.fps ?? 12;
	const width = params.width ?? 640;
	const height = params.height ?? 480;
	const now = Date.now();
	const frameDuration = Math.round(1000 / fps);

	const frames: ClipFrame[] = Array.from({ length: frameCount }, (_, index) => ({
		frameId: `mock-frame-${params.sequence}-${index}`,
		timestampMs: now - (frameCount - index) * frameDuration,
		width,
		height,
	}));

	return {
		clipId: `mock-clip-${params.sequence}-${now}`,
		startMs: frames[0]?.timestampMs ?? now,
		endMs: frames[frames.length - 1]?.timestampMs ?? now,
		fps,
		frames,
	};
}
