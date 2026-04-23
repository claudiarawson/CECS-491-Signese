import { useCallback, useRef, useState } from "react";

export type SessionTranslationEntry = {
  id: string;
  order: number;
  createdAtMs: number;
  originalText: string;
  translatedText: string;
};

export function useSessionTranslationHistory() {
  const [entries, setEntries] = useState<SessionTranslationEntry[]>([]);
  const orderRef = useRef(0);

  const appendEntry = useCallback(
    (partial: Pick<SessionTranslationEntry, "originalText" | "translatedText" | "createdAtMs">) => {
      orderRef.current += 1;
      const order = orderRef.current;
      const id = `${partial.createdAtMs}-${order}`;
      setEntries((prev) => [
        ...prev,
        {
          id,
          order,
          createdAtMs: partial.createdAtMs,
          originalText: partial.originalText,
          translatedText: partial.translatedText,
        },
      ]);
    },
    []
  );

  const clearHistory = useCallback(() => {
    orderRef.current = 0;
    setEntries([]);
  }, []);

  return { entries, appendEntry, clearHistory };
}
