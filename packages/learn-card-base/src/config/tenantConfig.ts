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

// -----------------------------------------------------------------
// Resolved tenant links
// -----------------------------------------------------------------

export interface ResolvedTenantLinks {
    termsOfServiceUrl: string;
    privacyPolicyUrl: string;
    contactUrl: string;
    websiteUrl: string;
    appStoreUrl?: string;
    playStoreUrl?: string;
    externalAuthRedirectBase?: string;
}

/**
 * Resolve the tenant's external links, filling in dynamic branded defaults
 * for any link not explicitly set in the tenant config.
 *
 * - If a URL is provided in `config.links`, it is used as-is.
 * - If omitted, the app's own `/legal/terms` and `/legal/privacy` routes are
 *   used. These routes render the standard legal content with the tenant's
 *   branding (name, logo) automatically.
 *
 * This lets whitelabel tenants get branded legal pages for free, while
 * tenants with their own legal pages can simply override in their config.
 */
export const getResolvedTenantLinks = (config: TenantConfig): ResolvedTenantLinks => {
    const { links } = config;

    return {
        termsOfServiceUrl: links.termsOfServiceUrl ?? '/legal/terms',
        privacyPolicyUrl: links.privacyPolicyUrl ?? '/legal/privacy',
        contactUrl: links.contactUrl ?? 'mailto:privacy@learningeconomy.io',
        websiteUrl: links.websiteUrl ?? 'https://www.learncard.com/',
        appStoreUrl: links.appStoreUrl,
        playStoreUrl: links.playStoreUrl,
        externalAuthRedirectBase: links.externalAuthRedirectBase,
    };
};
