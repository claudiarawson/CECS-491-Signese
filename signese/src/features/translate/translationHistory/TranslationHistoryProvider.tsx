import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslationHistory } from "./useTranslationHistory";
import {
  loadPersistedTranslationHistory,
  loadTranslationHistoryKeepOnDevice,
  savePersistedTranslationHistory,
  saveTranslationHistoryKeepOnDevice,
} from "./persistedTranslationHistory";

function createSessionId(): string {
  const c = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type TabTranslationHistoryValue = ReturnType<typeof useTranslationHistory> & {
  sessionId: string;
  keepHistoryOnDevice: boolean;
  setKeepHistoryOnDevice: (v: boolean) => void;
  historyPrefsLoaded: boolean;
  /** Stash caption text to apply when returning to Translate (e.g. after Reuse on history screen). */
  requestReuseCaption: (text: string) => void;
  consumePendingReuseCaption: () => string | null;
};

const TranslationHistoryContext = createContext<TabTranslationHistoryValue | null>(null);

/** Keeps session translation history alive for the whole tab shell (any tab can read the same session). */
export function TranslationHistoryProvider({ children }: { children: React.ReactNode }) {
  const history = useTranslationHistory();
  const { translationHistory, mergeHistoryItems } = history;
  const sessionIdRef = useRef(createSessionId());
  const pendingReuseCaptionRef = useRef<string | null>(null);
  const [keepHistoryOnDevice, setKeepHistoryOnDeviceState] = useState(false);
  const [historyPrefsLoaded, setHistoryPrefsLoaded] = useState(false);

  const requestReuseCaption = useCallback((text: string) => {
    pendingReuseCaptionRef.current = text;
  }, []);

  const consumePendingReuseCaption = useCallback((): string | null => {
    const next = pendingReuseCaptionRef.current;
    pendingReuseCaptionRef.current = null;
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const keep = await loadTranslationHistoryKeepOnDevice();
      if (cancelled) return;
      setKeepHistoryOnDeviceState(keep);
      if (keep) {
        const rows = await loadPersistedTranslationHistory();
        if (cancelled) return;
        mergeHistoryItems(rows);
      }
      setHistoryPrefsLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [mergeHistoryItems]);

  useEffect(() => {
    if (!historyPrefsLoaded || !keepHistoryOnDevice) {
      return;
    }
    void savePersistedTranslationHistory(translationHistory);
  }, [translationHistory, keepHistoryOnDevice, historyPrefsLoaded]);

  const setKeepHistoryOnDevice = useCallback(
    (v: boolean) => {
      setKeepHistoryOnDeviceState(v);
      void saveTranslationHistoryKeepOnDevice(v);
      if (v) {
        void (async () => {
          const rows = await loadPersistedTranslationHistory();
          mergeHistoryItems(rows);
        })();
      }
    },
    [mergeHistoryItems]
  );

  const value: TabTranslationHistoryValue = {
    ...history,
    sessionId: sessionIdRef.current,
    keepHistoryOnDevice,
    setKeepHistoryOnDevice,
    historyPrefsLoaded,
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
