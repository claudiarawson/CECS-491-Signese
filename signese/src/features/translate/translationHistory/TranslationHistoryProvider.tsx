import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
} from "react";
import { useTranslationHistory } from "./useTranslationHistory";

function createSessionId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type TabTranslationHistoryValue = ReturnType<typeof useTranslationHistory> & {
  sessionId: string;
  /** Stash caption text to apply when returning to Translate (e.g. after Reuse on history screen). */
  requestReuseCaption: (text: string) => void;
  consumePendingReuseCaption: () => string | null;
};

const TranslationHistoryContext = createContext<TabTranslationHistoryValue | null>(null);

/** Keeps session translation history alive for the whole tab shell (any tab can read the same session). */
export function TranslationHistoryProvider({ children }: { children: React.ReactNode }) {
  const history = useTranslationHistory();
  const sessionIdRef = useRef(createSessionId());
  const pendingReuseCaptionRef = useRef<string | null>(null);

  const requestReuseCaption = useCallback((text: string) => {
    pendingReuseCaptionRef.current = text;
  }, []);

  const consumePendingReuseCaption = useCallback((): string | null => {
    const next = pendingReuseCaptionRef.current;
    pendingReuseCaptionRef.current = null;
    return next;
  }, []);

  const value: TabTranslationHistoryValue = {
    ...history,
    sessionId: sessionIdRef.current,
    requestReuseCaption,
    consumePendingReuseCaption,
  };

  return (
    <TranslationHistoryContext.Provider value={value}>{children}</TranslationHistoryContext.Provider>
  );
}

export function useTabTranslationHistory(): TabTranslationHistoryValue {
  const ctx = useContext(TranslationHistoryContext);
  if (!ctx) {
    throw new Error("useTabTranslationHistory must be used within TranslationHistoryProvider");
  }
  return ctx;
}
