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

	const captionText = useMemo(
		() => (tokens.length > 0 ? tokens.map((token) => token.label).join(" ") : ""),
		[tokens]
	);

	return {
		tokens,
		captionText,
		append,
		clear,
	};
}
