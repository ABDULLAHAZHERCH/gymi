/**
 * In-Memory Data Cache
 *
 * Provides a thin caching layer that sits between the UI and Firestore.
 * - Data is cached in a Map keyed by a string key (e.g., "workouts:uid123")
 * - Each entry has a configurable TTL (default 5 minutes)
 * - Mutations (add/update/delete) invalidate the relevant cache keys
 * - Cache is per-session (cleared on full page reload, persists across navigations)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const store = new Map<string, CacheEntry<any>>();

/**
 * Get data from cache if it exists and hasn't expired.
 * Returns `undefined` if miss or stale.
 */
export function cacheGet<T>(key: string, ttl: number = DEFAULT_TTL): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.timestamp > ttl) {
    store.delete(key);
    return undefined;
  }
  return entry.data as T;
}

/**
 * Store data in the cache.
 */
export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate (delete) one or more cache keys.
 * Supports exact match or prefix match (e.g., "workouts:" clears all workout keys).
 */
export function cacheInvalidate(...patterns: string[]): void {
  for (const pattern of patterns) {
    if (pattern.endsWith(':')) {
      // Prefix match — delete all keys starting with this prefix
      for (const key of store.keys()) {
        if (key.startsWith(pattern)) {
          store.delete(key);
        }
      }
    } else {
      store.delete(pattern);
    }
  }
}

/**
 * Helper to wrap an async fetcher with caching.
 * If cached data exists and is fresh, returns it immediately.
 * Otherwise calls the fetcher, caches the result, and returns it.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  const cached = cacheGet<T>(key, ttl);
  if (cached !== undefined) return cached;

  const data = await fetcher();
  cacheSet(key, data);
  return data;
}

/**
 * Clear the entire cache. Useful on logout.
 */
export function cacheClear(): void {
  store.clear();
}
