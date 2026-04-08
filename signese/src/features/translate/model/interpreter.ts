import {
	LabelId,
	LabelScore,
	ModelPrediction,
	PostprocessConfig,
	PostprocessDecision,
} from "./types";

const DEFAULT_POSTPROCESS_CONFIG: PostprocessConfig = {
	emaAlpha: 0.55,
	minConfidence: 0.58,
	ambiguityGap: 0.09,
	duplicateCooldownMs: 1400,
	topK: 3,
};

export class PredictionInterpreter {
	private readonly config: PostprocessConfig;
	private smoothedByLabel = new Map<LabelId, number>();
	private lastEmission: { label: string; timestampMs: number } | null = null;

	constructor(config?: Partial<PostprocessConfig>) {
		this.config = { ...DEFAULT_POSTPROCESS_CONFIG, ...config };
	}

	apply(prediction: ModelPrediction): PostprocessDecision {
		// Isolated-sign postprocessing only: composed phrases are intentionally handled outside
		// this class so phrase definitions never become implicit primary classification labels.
		const smoothedScores = this.applyExponentialMovingAverage(prediction.scores);
		const topScores = smoothedScores.slice(0, this.config.topK);
		const top1 = topScores[0];
		const top2 = topScores[1];

		if (!top1 || top1.score < this.config.minConfidence) {
			return {
				smoothedScores,
				reason: "below-threshold",
			};
		}

		const useAmbiguousLabel =
			Boolean(top2) && top2.score > 0 && top1.score - top2.score <= this.config.ambiguityGap;
		const resolvedLabel = useAmbiguousLabel && top2 ? `${top1.label}/${top2.label}` : top1.label;

		if (
			this.lastEmission &&
			this.lastEmission.label === resolvedLabel &&
			prediction.createdAtMs - this.lastEmission.timestampMs < this.config.duplicateCooldownMs
		) {
			return {
				smoothedScores,
				reason: "duplicate-suppressed",
			};
		}

		this.lastEmission = {
			label: resolvedLabel,
			timestampMs: prediction.createdAtMs,
		};

		return {
			smoothedScores,
			reason: "accepted",
			token: {
				id: `${prediction.clipId}-${prediction.createdAtMs}`,
				label: resolvedLabel,
				source: useAmbiguousLabel ? "ambiguous" : "single",
				alternatives: useAmbiguousLabel && top2 ? [top1.label, top2.label] : undefined,
				confidence: top1.score,
				timestampMs: prediction.createdAtMs,
				rawTopK: topScores,
			},
		};
	}

	reset() {
		this.smoothedByLabel = new Map<LabelId, number>();
		this.lastEmission = null;
	}

	private applyExponentialMovingAverage(scores: LabelScore[]): LabelScore[] {
		const alpha = this.config.emaAlpha;

		for (const { label, score } of scores) {
			const previous = this.smoothedByLabel.get(label) ?? score;
			const smoothed = alpha * score + (1 - alpha) * previous;
			this.smoothedByLabel.set(label, smoothed);
		}

		return scores
			.map(({ label }) => ({
				label,
				score: this.smoothedByLabel.get(label) ?? 0,
			}))
			.sort((left, right) => right.score - left.score);
	}
}

export function getDefaultPostprocessConfig(): PostprocessConfig {
	return { ...DEFAULT_POSTPROCESS_CONFIG };
}
