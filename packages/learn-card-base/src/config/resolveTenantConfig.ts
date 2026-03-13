/**
 * Tenant Config Resolution
 *
 * Resolution order:
 *   1. Baked JSON (for native apps — embedded at build time in public/tenant-config.json)
 *   2. Fresh fetch from config service endpoint
 *   3. Cached version from localStorage
 *   4. Default LearnCard config as final fallback
 *
 * On web CNAME deployments, step 1 is skipped and the edge function injects
 * the config via the config service endpoint.
 */

import type { TenantConfig } from './tenantConfig';
import { parseTenantConfig, parsePartialTenantConfig } from './tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from './tenantDefaults';
import { deepMerge } from './deepMerge';

const CACHE_KEY_PREFIX = 'tenant-config-cache';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

interface CachedTenantConfig {
    config: TenantConfig;
    cachedAt: number;
}

/** Build a tenant-scoped cache key. Falls back to generic key for backward compat reads. */
const cacheKeyFor = (tenantId: string): string => `${CACHE_KEY_PREFIX}:${tenantId}`;

// -----------------------------------------------------------------
// Cache helpers
// -----------------------------------------------------------------

const readCache = (tenantHint?: string): TenantConfig | null => {
    try {
        // Try tenant-scoped key first, then fall back to legacy unscoped key
        const keys = tenantHint
            ? [cacheKeyFor(tenantHint), CACHE_KEY_PREFIX]
            : [CACHE_KEY_PREFIX];

        for (const key of keys) {
            const raw = localStorage.getItem(key);

            if (!raw) continue;

            const parsed: CachedTenantConfig = JSON.parse(raw);
            const age = Date.now() - parsed.cachedAt;

            if (age > CACHE_TTL_MS) {
                localStorage.removeItem(key);
                continue;
            }

            return parseTenantConfig(parsed.config, `localStorage cache (${key})`);
        }

        return null;
    } catch {
        return null;
    }
};

const writeCache = (config: TenantConfig): void => {
    try {
        const entry: CachedTenantConfig = { config, cachedAt: Date.now() };
        const key = cacheKeyFor(config.tenantId);

        localStorage.setItem(key, JSON.stringify(entry));

        // Clean up legacy unscoped key if it exists
        localStorage.removeItem(CACHE_KEY_PREFIX);
    } catch {
        // localStorage may not be available (SSR, private mode quota, etc.)
    }
};

// -----------------------------------------------------------------
// Fetchers
// -----------------------------------------------------------------

/**
 * Try to load the baked tenant-config.json from the app's public directory.
 * This file is placed there at CI time for native builds.
 */
const loadBakedConfig = async (): Promise<TenantConfig | null> => {
    try {
        const response = await fetch('/tenant-config.json');

        if (!response.ok) return null;

        const raw: unknown = await response.json();

        return parseTenantConfig(raw, 'baked tenant-config.json');
    } catch {
        return null;
    }
};

/**
 * Fetch fresh config from the tenant config service.
 *
 * @param endpoint - The config service URL. Defaults to `/api/tenant-config`.
 *   For web CNAME, the edge function serves this at the app's own domain.
 *   For native, this would be the central config service URL with a `?domain=` param.
 */
const fetchFreshConfig = async (endpoint?: string): Promise<TenantConfig | null> => {
    try {
        const url = endpoint ?? '/__tenant-config';
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) return null;

        const raw: unknown = await response.json();

        // Try full config parse first (e.g. a config service returning complete configs)
        const full = parseTenantConfig(raw, `fetch ${url}`);

        if (full) return full;

        // Fall back to partial parse — edge functions may return only overrides.
        // Deep-merge onto defaults to produce a complete config.
        const partial = parsePartialTenantConfig(raw, `fetch ${url} (partial)`);

        if (partial && typeof partial === 'object') {
            const merged = deepMerge(
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                partial as Record<string, unknown>,
            );

            return parseTenantConfig(merged, `fetch ${url} (merged)`);
        }

        return null;
    } catch {
        return null;
    }
};

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

export interface ResolveTenantConfigOptions {
    /**
     * Override the config service endpoint.
     * For native apps: `https://config.learncard.com/api/tenant-config?domain=learncard.app`
     * For web: defaults to `/api/tenant-config` (served by the edge function)
     */
    configEndpoint?: string;

    /**
     * Skip the network fetch and only use baked/cached/default config.
     * Useful for tests or offline-first boot.
     */
    offlineOnly?: boolean;

    /**
     * Provide a static config directly — bypasses all resolution.
     * Useful for tests or local dev with a known config.
     */
    staticConfig?: TenantConfig;
}

/**
 * Resolve the TenantConfig for the current environment.
 *
 * Call this once at app boot, before React renders.
 */
export const resolveTenantConfig = async (
    options: ResolveTenantConfigOptions = {}
): Promise<TenantConfig> => {
    // Static override — for tests or explicit config injection
    if (options.staticConfig) {
        return options.staticConfig;
    }

    // 1. Try baked config (native builds)
    const baked = await loadBakedConfig();
    const bakedTenantId = baked?.tenantId;

    // 2. Try fresh fetch from config service (unless offline-only)
    let fresh: TenantConfig | null = null;

    if (!options.offlineOnly) {
        fresh = await fetchFreshConfig(options.configEndpoint);

        if (fresh) {
            writeCache(fresh);
        }
    }

    // 3. If fresh fetch succeeded, use it
    if (fresh) return fresh;

    // 4. If baked config exists, use it (and try to refresh in background)
    if (baked) return baked;

    // 5. Try cached version (use baked tenantId as hint to find the right cache entry)
    const cached = readCache(bakedTenantId);

    if (cached) return cached;

    // 6. Final fallback — default LearnCard config
    return DEFAULT_LEARNCARD_TENANT_CONFIG;
};

/**
 * Trigger a background refresh of the tenant config.
 * Does not block the UI — just updates the cache for next boot.
 */
export const refreshTenantConfigInBackground = (endpoint?: string): void => {
    fetchFreshConfig(endpoint).then(config => {
        if (config) {
            writeCache(config);
        }
    }).catch(() => {
        // Silent failure — cache will be used on next boot
    });
};
