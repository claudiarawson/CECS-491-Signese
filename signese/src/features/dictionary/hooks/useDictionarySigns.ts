import { useCallback, useEffect, useRef, useState } from "react";
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { fetchDictionarySignsPage } from "@/src/services/dictionary/dictionarySigns.service";
import type { Sign } from "@/src/features/dictionary/types";

export function useDictionarySigns() {
  const [signs, setSigns] = useState<Sign[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const genRef = useRef(0);
  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const hasMoreRef = useRef(true);
  const loadingMoreRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingMoreRef.current) return;
    const expectedGen = genRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchDictionarySignsPage(lastDocRef.current);
      if (genRef.current !== expectedGen) return;
      setSigns((prev) => [...prev, ...page.signs]);
      lastDocRef.current = page.lastDoc;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  const reload = useCallback(async () => {
    const expectedGen = ++genRef.current;
    setLoading(true);
    setError(null);
    setSigns([]);
    lastDocRef.current = null;
    hasMoreRef.current = true;
    setHasMore(true);
    try {
      const first = await fetchDictionarySignsPage(null);
      if (genRef.current !== expectedGen) return;
      setSigns(first.signs);
      lastDocRef.current = first.lastDoc;
      hasMoreRef.current = first.hasMore;
      setHasMore(first.hasMore);
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
    loadingMore,
    hasMore,
    error,
    reload,
    loadMore,
    /** Always false: the full collection is loaded in pages (no 200-doc cap). */
    datasetCapped: false,
    fetchLimit: undefined as number | undefined,
  };
}
