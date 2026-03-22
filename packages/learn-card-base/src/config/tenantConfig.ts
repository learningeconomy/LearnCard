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
    TENANT_CONFIG_SCHEMA_VERSION,
} from './tenantConfigSchema';

export { deepMerge } from './deepMerge';
export { isProductionEnvironment } from './isProduction';

import type { TenantConfig } from './tenantConfigSchema';
import { isProductionEnvironment } from './isProduction';

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------

/**
 * Get the tenant's base URL, accounting for production vs dev.
 *
 * Replaces all scattered `IS_PRODUCTION ? 'https://domain' : 'http://localhost:3000'` patterns.
 */
export const getTenantBaseUrl = (config: TenantConfig): string => {
    if (isProductionEnvironment()) {
        return `https://${config.domain}`;
    }

    return `http://${config.devDomain ?? 'localhost:3000'}`;
};
