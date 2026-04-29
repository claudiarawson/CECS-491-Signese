import { useCallback, useRef, useState } from "react";
import type { TranslationHistoryItem } from "./types";

export const TRANSLATE_SOURCE_LANG = "ASL (sign)";
export const TRANSLATE_TARGET_LANG = "English (captions)";

function createHistoryId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

type AddInput = {
  originalText: string;
  translatedText: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export function useTranslationHistory() {
  const [translationHistory, setTranslationHistory] = useState<TranslationHistoryItem[]>([]);
  const sequenceRef = useRef(0);

  const addHistoryItem = useCallback((item: AddInput): string => {
    sequenceRef.current += 1;
    const sequence = sequenceRef.current;
    const row: TranslationHistoryItem = {
      id: createHistoryId(),
      sequence,
      createdAt: new Date().toISOString(),
      sourceLanguage: item.sourceLanguage ?? TRANSLATE_SOURCE_LANG,
      targetLanguage: item.targetLanguage ?? TRANSLATE_TARGET_LANG,
      originalText: item.originalText,
      translatedText: item.translatedText,
    };
    setTranslationHistory((prev) => [row, ...prev]);
    return row.id;
  }, []);

  const clearHistory = useCallback(() => {
    sequenceRef.current = 0;
    setTranslationHistory([]);
  }, []);

  const mergeHistoryItems = useCallback((incoming: TranslationHistoryItem[]) => {
    if (incoming.length === 0) return;
    setTranslationHistory((prev) => {
      const map = new Map<string, TranslationHistoryItem>();
      for (const row of incoming) map.set(row.id, row);
      for (const row of prev) map.set(row.id, row);
      return Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }, []);

  return {
    translationHistory,
    addHistoryItem,
    clearHistory,
    mergeHistoryItems,
  };
}
