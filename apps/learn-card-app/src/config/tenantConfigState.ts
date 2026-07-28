/**
 * Tenant Config State
 *
 * Lightweight, dependency-free accessors for the resolved TenantConfig.
 *
 * Deliberately imports nothing at runtime (type-only `learn-card-base` import)
 * so modules that only need to *read* the resolved config — e.g. the analytics
 * context — can do so without pulling in the heavy bootstrap graph (Firebase,
 * Sentry, Userflow, theme store, debug events). Keeping these reads off the
 * heavy graph avoids a circular dependency between the analytics barrel and
 * `context.tsx`. See `bootstrapTenantConfig.ts` for the actual bootstrap logic.
 */

import type { TenantConfig } from 'learn-card-base';

type TenantBootstrapState = {
    resolvedConfig: TenantConfig | null;
    bootstrapPromise: Promise<TenantConfig> | null;
};

const TENANT_BOOTSTRAP_STATE_KEY = '__learncardTenantBootstrapState__';

export const getTenantBootstrapState = (): TenantBootstrapState => {
    const globalScope = globalThis as typeof globalThis & {
        [TENANT_BOOTSTRAP_STATE_KEY]?: TenantBootstrapState;
    };

    if (!globalScope[TENANT_BOOTSTRAP_STATE_KEY]) {
        globalScope[TENANT_BOOTSTRAP_STATE_KEY] = {
            resolvedConfig: null,
            bootstrapPromise: null,
        };
    }

    return globalScope[TENANT_BOOTSTRAP_STATE_KEY];
};

// Module-level cache backed by global state so HMR does not clear the resolved config.
let _resolvedConfig: TenantConfig | null = getTenantBootstrapState().resolvedConfig;

export const setResolvedTenantConfig = (config: TenantConfig): void => {
    _resolvedConfig = config;
    getTenantBootstrapState().resolvedConfig = config;
};

/**
 * Get the resolved TenantConfig synchronously.
 * Only available after `bootstrapTenantConfig()` has been called.
 */
export const getResolvedTenantConfig = (): TenantConfig => {
    const config = _resolvedConfig ?? getTenantBootstrapState().resolvedConfig;

    if (!config) {
        throw new Error('TenantConfig not yet resolved. Call bootstrapTenantConfig() first.');
    }

    _resolvedConfig = config;

    return config;
};

/**
 * Get headers that identify the current tenant to backend services.
 * Merges with any existing headers object so callers can spread or pass directly.
 */
export const getTenantHeaders = (): Record<string, string> => {
    const tenantId = (_resolvedConfig ?? getTenantBootstrapState().resolvedConfig)?.tenantId;

    if (!tenantId) return {};

    return { 'X-Tenant-Id': tenantId };
};
