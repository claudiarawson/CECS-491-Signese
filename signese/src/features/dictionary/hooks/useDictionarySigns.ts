import { useCallback, useEffect, useState } from "react";
import { fetchDictionarySigns, getDictionaryQueryLimit } from "@/src/services/dictionary/dictionarySigns.service";
import type { Sign } from "@/src/features/dictionary/types";

const FETCH_LIMIT = getDictionaryQueryLimit();

export function useDictionarySigns() {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchDictionarySigns();
      setSigns(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setSigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    signs,
    loading,
    error,
    reload,
    /** True when Firestore query is capped (default 200 for fast demos). */
    datasetCapped: FETCH_LIMIT != null,
    fetchLimit: FETCH_LIMIT,
  };
}
