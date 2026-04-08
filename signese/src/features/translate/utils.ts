import { LabelScore } from "./model/types";

export function makeRuntimeId(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatTopScores(scores: LabelScore[], count = 2): string {
	if (scores.length === 0) {
		return "n/a";
	}

	return scores
		.slice(0, count)
		.map((item) => `${item.label}:${item.score.toFixed(2)}`)
		.join(" | ");
}
