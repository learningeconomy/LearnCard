/**
 * Simple in-memory LRU cache with optional TTL.
 *
 * Based on the lca-api utility of the same name, extended with per-entry TTL
 * so entries expire without needing manual eviction. Intended for caching hot
 * read-heavy data in the brain lambda (Boost / AppStoreListing / Integration /
 * SigningAuthority) where a warm lambda instance can serve repeat requests
 * without re-querying Neo4j.
 *
 * Semantics:
 * - get(key) returns undefined if the entry is missing OR expired.
 * - add(key, value, ttlMs?) sets the entry; ttlMs defaults to Infinity.
 * - invalidate(key) removes a specific entry; use this from write paths when
 *   you need stronger consistency than TTL-only eviction provides.
 * - flush() clears everything.
 *
 * This is a singleton-per-call-site cache. Each caller creates its own LRU via
 * getLRUCache<T>(limit) so eviction/TTL policies don't cross entity types.
 */
export const getLRUCache = <T>(limit = 50) => {
    type Entry = { key: string; value: T; timestamp: number; expiresAt: number };
    let items: Entry[] = [];

    const get = (key: string): T | undefined => {
        const now = Date.now();
        const index = items.findIndex(item => item.key === key);

        if (index < 0) return undefined;

        const entry = items[index]!;
        if (entry.expiresAt <= now) {
            // Expired — drop and miss.
            items.splice(index, 1);
            return undefined;
        }

        entry.timestamp = now;
        items.sort((a, b) => b.timestamp - a.timestamp);
        items = items.slice(0, limit);

        return entry.value;
    };

    const add = (key: string, value: T, ttlMs: number = Number.POSITIVE_INFINITY): void => {
        const now = Date.now();
        const expiresAt = ttlMs === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : now + ttlMs;

        // Drop any existing entry for this key before unshift so we don't carry duplicates.
        const existingIndex = items.findIndex(item => item.key === key);
        if (existingIndex >= 0) items.splice(existingIndex, 1);

        items.unshift({ key, value, timestamp: now, expiresAt });
        items = items.slice(0, limit);
    };

    const invalidate = (key: string): boolean => {
        const index = items.findIndex(item => item.key === key);
        if (index < 0) return false;
        items.splice(index, 1);
        return true;
    };

    const flush = (): void => {
        items = [];
    };

    /** For tests / diagnostics only. Returns the current item count. */
    const size = (): number => items.length;

    return { get, add, invalidate, flush, size };
};
