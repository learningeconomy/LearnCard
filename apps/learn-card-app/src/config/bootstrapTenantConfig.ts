/**
 * Bootstrap Tenant Config
 *
 * This module wires TenantConfig into all the subsystems that need it
 * before React renders. Call `bootstrapTenantConfig()` once in main.tsx.
 */

import type { TenantConfig } from 'learn-card-base';
import { resolveTenantConfig, setAuthConfigFromTenant, getTenantBaseUrl } from 'learn-card-base';
import { initNetworkStoreFromTenant } from 'learn-card-base';

import { initializeFirebaseFromTenant } from '../firebase/firebase';
import { initSentryFromTenant } from '../constants/sentry';
import { initUserflowFromTenant } from '../constants/userflow';

// Module-level singleton so other modules can access config synchronously
let _resolvedConfig: TenantConfig | null = null;

/**
 * Get the resolved TenantConfig synchronously.
 * Only available after `bootstrapTenantConfig()` has been called.
 */
export const getResolvedTenantConfig = (): TenantConfig => {
    if (!_resolvedConfig) {
        throw new Error('TenantConfig not yet resolved. Call bootstrapTenantConfig() first.');
    }

    return _resolvedConfig;
};

/**
 * Get the base URL for the current tenant (e.g. `https://learncard.app` or `http://localhost:3000`).
 * Synchronous helper for use outside React components.
 */
export const getAppBaseUrl = (): string => {
    return getTenantBaseUrl(getResolvedTenantConfig());
};

/**
 * Resolve the TenantConfig and initialize all subsystems.
 *
 * Call this once before ReactDOM.createRoot().render().
 *
 * Initializes:
 *   1. Firebase (from tenant auth.firebase config)
 *   2. Auth config overrides (from tenant auth config)
 *   3. Network store (from tenant APIs config)
 *   4. Sentry error tracking
 *   5. Userflow product tours
 */
export const bootstrapTenantConfig = async (): Promise<TenantConfig> => {
    const config = await resolveTenantConfig();

    _resolvedConfig = config;

    // 1. Initialize Firebase with tenant-specific project config
    initializeFirebaseFromTenant(config.auth.firebase);

    // 2. Bridge auth config so getAuthConfig() returns tenant-aware values
    setAuthConfigFromTenant(config);

    // 3. Populate network store with tenant API endpoints
    initNetworkStoreFromTenant(config.apis);

    // 4. Initialize Sentry from tenant observability config
    initSentryFromTenant();

    // 5. Initialize Userflow from tenant observability config
    initUserflowFromTenant();

    return config;
};
