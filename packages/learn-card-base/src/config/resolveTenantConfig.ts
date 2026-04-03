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
import { parseTenantConfig, parsePartialTenantConfig, TENANT_CONFIG_SCHEMA_VERSION } from './tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from './tenantDefaults';
import { deepMerge } from './deepMerge';

const CACHE_KEY_PREFIX = 'tenant-config-cache';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

// ---------------------------------------------------------------------------
// Optional fetch-failure callback (for Sentry breadcrumbs, telemetry, etc.)
//
// Apps call `setOnFetchFailure()` at boot to wire this up — keeps learn-card-base
// free of any direct Sentry dependency.
// ---------------------------------------------------------------------------

export interface FetchFailureInfo {
    endpoint: string;
    error: string;
}

let _onFetchFailure: ((info: FetchFailureInfo) => void) | undefined;

/**
 * Register a callback invoked when `fetchFreshConfig` fails.
 * Use this to add Sentry breadcrumbs or other telemetry from the app layer.
 *
 * @example
 * ```ts
 * import * as Sentry from '@sentry/browser';
 * import { setOnFetchFailure } from 'learn-card-base/config/resolveTenantConfig';
 *
 * setOnFetchFailure(({ endpoint, error }) => {
 *     Sentry.addBreadcrumb({
 *         category: 'tenant-config',
 *         message: `fetchFreshConfig failed: ${error}`,
 *         level: 'warning',
 *         data: { endpoint },
 *     });
 * });
 * ```
 */
export const setOnFetchFailure = (cb: (info: FetchFailureInfo) => void): void => {
    _onFetchFailure = cb;
};

interface CachedTenantConfig {
    config: TenantConfig;
    cachedAt: number;
    schemaVersion?: number;
}

/** Build a tenant-scoped cache key. Falls back to generic key for backward compat reads. */
const cacheKeyFor = (tenantId: string): string => `${CACHE_KEY_PREFIX}:${tenantId}`;

// -----------------------------------------------------------------
// Cache helpers
// -----------------------------------------------------------------

const readCache = (tenantHint?: string, onEvent?: OnConfigEvent): TenantConfig | null => {
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
                onEvent?.('config:cache_expired', `Cache expired (age ${Math.round(age / 1000)}s, TTL ${CACHE_TTL_MS / 1000}s)`, { key, ageMs: age, ttlMs: CACHE_TTL_MS });
                continue;
            }

            // Invalidate cache if the schema version has changed
            if (parsed.schemaVersion !== TENANT_CONFIG_SCHEMA_VERSION) {
                localStorage.removeItem(key);
                onEvent?.('config:cache_schema_mismatch', `Cache schema v${parsed.schemaVersion} ≠ current v${TENANT_CONFIG_SCHEMA_VERSION}`, { key, cachedVersion: parsed.schemaVersion, currentVersion: TENANT_CONFIG_SCHEMA_VERSION });
                continue;
            }

            onEvent?.('config:cache_hit', `Cache hit from ${key}`, { key, ageMs: age, tenantId: parsed.config?.tenantId });

            return parseTenantConfig(parsed.config, `localStorage cache (${key})`);
        }

        onEvent?.('config:cache_miss', 'No valid cache entry found', { tenantHint });

        return null;
    } catch {
        onEvent?.('config:cache_miss', 'Cache read failed (parse error or unavailable)', { tenantHint });

        return null;
    }
};

const writeCache = (config: TenantConfig, onEvent?: OnConfigEvent): void => {
    try {
        const entry: CachedTenantConfig = { config, cachedAt: Date.now(), schemaVersion: TENANT_CONFIG_SCHEMA_VERSION };
        const key = cacheKeyFor(config.tenantId);

        localStorage.setItem(key, JSON.stringify(entry));

        // Clean up legacy unscoped key if it exists
        localStorage.removeItem(CACHE_KEY_PREFIX);

        onEvent?.('config:cache_write', `Cached config for ${config.tenantId}`, { key, tenantId: config.tenantId });
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
const loadBakedConfig = async (onEvent?: OnConfigEvent): Promise<TenantConfig | null> => {
    try {
        const response = await fetch('/tenant-config.json');

        if (!response.ok) {
            onEvent?.('config:baked_missing', `Baked config not found (HTTP ${response.status})`, { status: response.status });

            return null;
        }

        const raw: unknown = await response.json();
        const config = parseTenantConfig(raw, 'baked tenant-config.json');

        if (config) {
            onEvent?.('config:baked_loaded', `Baked config loaded: ${config.tenantId}`, { tenantId: config.tenantId, domain: config.domain });
        } else {
            onEvent?.('config:baked_missing', 'Baked config found but failed schema validation');
        }

        return config;
    } catch {
        onEvent?.('config:baked_missing', 'Baked config fetch threw an error');

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
const fetchFreshConfig = async (endpoint?: string, onEvent?: OnConfigEvent, mergeBase?: TenantConfig): Promise<TenantConfig | null> => {
    try {
        const url = endpoint ?? '/__tenant-config';

        onEvent?.('config:fetch_start', `Fetching config from ${url}`, { url, timeout: 5000 });

        const t0 = Date.now();

        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            signal: AbortSignal.timeout(5000),
        });

        const durationMs = Date.now() - t0;

        if (!response.ok) {
            onEvent?.('config:fetch_error', `Fetch returned HTTP ${response.status}`, { url, status: response.status, durationMs });

            return null;
        }

        const raw: unknown = await response.json();

        // When a mergeBase exists (baked config from native builds or CI),
        // always treat the fetch response as an overlay — deep-merge it onto
        // the baked config rather than replacing it. Edge functions and config
        // services return tenant-specific overrides, not complete configs.
        // Without this, Zod schema defaults fill in missing fields, making the
        // response look "full" and causing the baked config to be discarded.
        if (mergeBase) {
            const partial = parsePartialTenantConfig(raw, `fetch ${url} (overlay)`);

            if (partial && typeof partial === 'object') {
                onEvent?.('config:fetch_partial_merge', `Fetched config overlay, merging onto baked config (${mergeBase.tenantId}) (${durationMs}ms)`, { url, durationMs, overrideKeys: Object.keys(partial as Record<string, unknown>), mergeBase: `baked (${mergeBase.tenantId})` });

                const merged = deepMerge(
                    mergeBase as unknown as Record<string, unknown>,
                    partial as Record<string, unknown>,
                );

                const result = parseTenantConfig(merged, `fetch ${url} (merged onto baked)`);

                if (result) {
                    onEvent?.('config:fetch_success', `Merged config resolved: ${result.tenantId} (${durationMs}ms)`, { url, tenantId: result.tenantId, durationMs, parseMode: 'overlay_on_baked' });
                }

                return result;
            }

            onEvent?.('config:fetch_error', `Fetch succeeded but partial parse failed — using baked config as-is`, { url, durationMs });

            return null;
        }

        // No baked config — try full config parse (e.g. a config service returning complete configs)
        const full = parseTenantConfig(raw, `fetch ${url}`);

        if (full) {
            onEvent?.('config:fetch_success', `Full config fetched: ${full.tenantId} (${durationMs}ms)`, { url, tenantId: full.tenantId, durationMs, parseMode: 'full' });

            return full;
        }

        // Fall back to partial parse — deep-merge onto DEFAULT_LEARNCARD_TENANT_CONFIG.
        const partial = parsePartialTenantConfig(raw, `fetch ${url} (partial)`);

        if (partial && typeof partial === 'object') {
            onEvent?.('config:fetch_partial_merge', `Partial config fetched, merging onto defaults (${durationMs}ms)`, { url, durationMs, overrideKeys: Object.keys(partial as Record<string, unknown>), mergeBase: 'defaults' });

            const merged = deepMerge(
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                partial as Record<string, unknown>,
            );

            const result = parseTenantConfig(merged, `fetch ${url} (merged)`);

            if (result) {
                onEvent?.('config:fetch_success', `Merged config resolved: ${result.tenantId} (${durationMs}ms)`, { url, tenantId: result.tenantId, durationMs, parseMode: 'partial_merge' });
            }

            return result;
        }

        onEvent?.('config:fetch_error', `Fetch succeeded but config parsing failed`, { url, durationMs });

        return null;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const url = endpoint ?? '/__tenant-config';

        console.warn(`[TenantConfig] fetchFreshConfig failed (${url}): ${message}`);

        onEvent?.('config:fetch_error', `Fetch error: ${message}`, { url, error: message });

        _onFetchFailure?.({ endpoint: url, error: message });

        return null;
    }
};

// -----------------------------------------------------------------
// Public API
// -----------------------------------------------------------------

/**
 * Optional callback invoked at each resolution step for observability.
 * The app layer can use this to feed events into a debug timeline, telemetry, etc.
 *
 * @param step  - A namespaced event key, e.g. `'config:baked_loaded'`
 * @param message - Human-readable description of what happened
 * @param data    - Optional structured data for the event
 */
export type OnConfigEvent = (step: string, message: string, data?: Record<string, unknown>) => void;

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

    /**
     * Optional callback invoked at each resolution step.
     * Use this to wire up debug timelines, telemetry, etc.
     */
    onEvent?: OnConfigEvent;
}

/**
 * Resolve the TenantConfig for the current environment.
 *
 * Call this once at app boot, before React renders.
 */
export const resolveTenantConfig = async (
    options: ResolveTenantConfigOptions = {}
): Promise<TenantConfig> => {
    const { onEvent } = options;

    onEvent?.('config:resolve_start', 'Starting tenant config resolution', { offlineOnly: !!options.offlineOnly, hasStaticConfig: !!options.staticConfig, hasEndpoint: !!options.configEndpoint });

    // Static override — for tests or explicit config injection
    if (options.staticConfig) {
        onEvent?.('config:static_override', `Using static config: ${options.staticConfig.tenantId}`, { tenantId: options.staticConfig.tenantId });
        onEvent?.('config:resolved', `Resolved via static override: ${options.staticConfig.tenantId}`, { source: 'static', tenantId: options.staticConfig.tenantId });

        return options.staticConfig;
    }

    // 1. Try baked config (native builds)
    const baked = await loadBakedConfig(onEvent);
    const bakedTenantId = baked?.tenantId;

    // 2. Try fresh fetch from config service (unless offline-only)
    let fresh: TenantConfig | null = null;

    if (!options.offlineOnly) {
        fresh = await fetchFreshConfig(options.configEndpoint, onEvent, baked ?? undefined);

        if (fresh) {
            writeCache(fresh, onEvent);
        }
    } else {
        onEvent?.('config:fetch_start', 'Skipping fetch (offlineOnly)', { offlineOnly: true });
    }

    // 3. If fresh fetch succeeded, use it
    if (fresh) {
        onEvent?.('config:resolved', `Resolved via fresh fetch: ${fresh.tenantId}`, { source: 'fresh', tenantId: fresh.tenantId });

        return fresh;
    }

    // 4. If baked config exists, use it (and try to refresh in background)
    if (baked) {
        onEvent?.('config:resolved', `Resolved via baked config: ${baked.tenantId}`, { source: 'baked', tenantId: baked.tenantId });

        return baked;
    }

    // 5. Try cached version (use baked tenantId as hint to find the right cache entry)
    const cached = readCache(bakedTenantId, onEvent);

    if (cached) {
        onEvent?.('config:resolved', `Resolved via cache: ${cached.tenantId}`, { source: 'cache', tenantId: cached.tenantId });

        return cached;
    }

    // 6. Final fallback — default LearnCard config
    onEvent?.('config:fallback_default', 'All sources failed — using DEFAULT_LEARNCARD_TENANT_CONFIG', { tenantId: DEFAULT_LEARNCARD_TENANT_CONFIG.tenantId });
    onEvent?.('config:resolved', `Resolved via default fallback: ${DEFAULT_LEARNCARD_TENANT_CONFIG.tenantId}`, { source: 'default', tenantId: DEFAULT_LEARNCARD_TENANT_CONFIG.tenantId });

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
