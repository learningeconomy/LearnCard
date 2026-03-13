/**
 * TenantConfig — the single source of truth for all tenant-specific configuration.
 *
 * Types are inferred from the Zod schema in `tenantConfigSchema.ts`.
 * This file re-exports them so existing consumers don't need to change imports.
 */

// Re-export all types and schemas from the Zod schema file
export type {
    TenantConfig,
    TenantApiConfig,
    TenantAuthConfig,
    TenantFirebaseConfig,
    TenantWeb3AuthConfig,
    TenantBrandingConfig,
    TenantFeatureConfig,
    TenantObservabilityConfig,
    TenantLinksConfig,
    TenantNativeConfig,
    TenantEcosystemConfig,
} from './tenantConfigSchema';

export {
    tenantConfigSchema,
    tenantApiConfigSchema,
    tenantAuthConfigSchema,
    tenantFirebaseConfigSchema,
    tenantWeb3AuthConfigSchema,
    tenantBrandingConfigSchema,
    tenantFeatureConfigSchema,
    tenantObservabilityConfigSchema,
    tenantLinksConfigSchema,
    tenantNativeConfigSchema,
    tenantEcosystemConfigSchema,
    parseTenantConfig,
    parsePartialTenantConfig,
} from './tenantConfigSchema';

export { deepMerge } from './deepMerge';

import type { TenantConfig } from './tenantConfigSchema';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Get the tenant's base URL, accounting for production vs dev.
 *
 * Replaces all scattered `IS_PRODUCTION ? 'https://domain' : 'http://localhost:3000'` patterns.
 */
export const getTenantBaseUrl = (config: TenantConfig): string => {
    // IS_PRODUCTION is a Vite `define` global only available in apps that set it.
    // We use a typeof guard so this works safely in any environment.
    const isProduction =
        // eslint-disable-next-line no-restricted-globals
        (typeof IS_PRODUCTION !== 'undefined' && (IS_PRODUCTION as unknown as boolean)) ||
        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production');

    if (isProduction) {
        return `https://${config.domain}`;
    }

    return `http://${config.devDomain ?? 'localhost:3000'}`;
};

// Ambient declaration so TypeScript doesn't error on the typeof guard above.
// The actual value is injected by Vite's `define` in consuming apps.
declare const IS_PRODUCTION: boolean | undefined;
