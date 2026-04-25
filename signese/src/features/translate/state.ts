import { useCallback, useMemo, useState } from "react";
import { CaptionToken } from "./model/types";

export function useCaptionBuffer(maxTokens = 24) {
	const [tokens, setTokens] = useState<CaptionToken[]>([]);

	const append = useCallback(
		(token: CaptionToken) => {
			setTokens((previous) => {
				const next = [...previous, token];
				if (next.length <= maxTokens) {
					return next;
				}

				return next.slice(next.length - maxTokens);
			});
		},
		[maxTokens]
	);

	const clear = useCallback(() => {
		setTokens([]);
	}, []);

	const replaceCaptionFromText = useCallback((text: string) => {
		const trimmed = text.trim();
		if (!trimmed) {
			setTokens([]);
			return;
		}
		const words = trimmed.split(/\s+/);
		const now = Date.now();
		setTokens(
			words.map((label, i) => ({
				id: `reuse-${now}-${i}-${label}`,
				label,
				source: "single" as const,
				confidence: 1,
				timestampMs: now + i,
				rawTopK: [],
			}))
		);
	}, []);

	const captionText = useMemo(
		() => (tokens.length > 0 ? tokens.map((token) => token.label).join(" ") : ""),
		[tokens]
	);

	return {
		tokens,
		captionText,
		append,
		clear,
		replaceCaptionFromText,
	};
}
