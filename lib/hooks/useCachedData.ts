'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cacheGet, cacheSet } from '@/lib/cache';

interface UseCachedDataOptions<T> {
  /** Unique cache key (e.g., "workouts:uid123") */
  key: string;
  /** Async function that fetches the data */
  fetcher: () => Promise<T>;
  /** Whether fetching is enabled (e.g., user is authenticated) */
  enabled?: boolean;
  /** Cache TTL in ms (default: 5 minutes) */
  ttl?: number;
  /** Stale-while-revalidate: max age before background refresh (default: 2 minutes) */
  staleTime?: number;
}

interface UseCachedDataReturn<T> {
  /** The data (initialized from cache if available) */
  data: T | undefined;
  /** True only on initial load when no cached data exists */
  loading: boolean;
  /** Error from the last fetch attempt */
  error: Error | null;
  /** Manually set the data (for optimistic updates after mutations) */
  setData: (data: T | ((prev: T | undefined) => T)) => void;
  /** Force a fresh fetch, ignoring cache */
  refetch: () => Promise<void>;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_STALE_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * SWR-like hook backed by the in-memory cache.
 *
 * - Synchronously initializes from cache → no loading flash on revisit
 * - Shows loading state only on cold start (no cache)
 * - Background revalidates when data is stale
 * - Supports optimistic updates via `setData`
 */
export function useCachedData<T>({
  key,
  fetcher,
  enabled = true,
  ttl = DEFAULT_TTL,
  staleTime = DEFAULT_STALE_TIME,
}: UseCachedDataOptions<T>): UseCachedDataReturn<T> {
  // Synchronously read from cache for initial state
  const cached = enabled ? cacheGet<T>(key, ttl) : undefined;

  const [data, setDataState] = useState<T | undefined>(cached);
  const [loading, setLoading] = useState(!cached && enabled);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Keep mounted ref in sync
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Core fetch logic
  const doFetch = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setDataState(result);
        setError(null);
        cacheSet(key, result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [key, fetcher]);

  // On mount / key change: fetch if no cache or stale
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const cachedNow = cacheGet<T>(key, ttl);

    if (cachedNow !== undefined) {
      // Have cached data — check if stale
      setDataState(cachedNow);
      setLoading(false);

      const entry = cacheGet<T>(key, staleTime);
      if (entry === undefined) {
        // Data exists but is stale — background revalidate
        doFetch();
      }
    } else {
      // No cache — full loading state
      setLoading(true);
      doFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  // Manual set (for optimistic updates)
  const setData = useCallback(
    (updater: T | ((prev: T | undefined) => T)) => {
      setDataState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T | undefined) => T)(prev) : updater;
        cacheSet(key, next);
        return next;
      });
    },
    [key]
  );

  // Force refetch
  const refetch = useCallback(async () => {
    setLoading((prev) => data === undefined ? true : prev);
    await doFetch();
  }, [doFetch, data]);

  return { data, loading, error, setData, refetch };
}
