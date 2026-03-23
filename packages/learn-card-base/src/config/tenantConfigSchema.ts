/**
 * TenantConfig Zod Schema — single source of truth for:
 *   - Runtime validation of config from edge functions, localStorage, baked JSON
 *   - TypeScript type inference (TenantConfig = z.infer<typeof tenantConfigSchema>)
 *   - Default values (via .default()) replacing tenantDefaults.ts
 *
 * Use `.passthrough()` on all object schemas so newer config fields from the
 * server don't break older clients.
 */

import { z, type ZodIssue } from 'zod';

// -----------------------------------------------------------------
// Sub-schemas
// -----------------------------------------------------------------

export const tenantApiConfigSchema = z.object({
    brainService: z.string(),
    brainServiceApi: z.string(),
    cloudService: z.string(),
    lcaApi: z.string(),
    xapi: z.string().optional(),
    aiService: z.string().optional(),
    corsProxyApiKey: z.string().optional(),
}).passthrough();

export const tenantFirebaseConfigSchema = z.object({
    apiKey: z.string(),
    authDomain: z.string(),
    projectId: z.string(),
    storageBucket: z.string(),
    messagingSenderId: z.string(),
    appId: z.string(),
    measurementId: z.string().optional(),
}).passthrough();

export const tenantWeb3AuthConfigSchema = z.object({
    clientId: z.string(),
    network: z.string(),
    verifierId: z.string(),
    rpcTarget: z.string().default('https://rpc.ankr.com/eth'),
}).passthrough();

export const tenantAuthConfigSchema = z.object({
    provider: z.string().default('firebase'),
    keyDerivation: z.enum(['sss', 'web3auth']).default('sss'),
    sssServerUrl: z.string().default('https://api.learncard.app/trpc'),
    enableEmailBackupShare: z.boolean().default(true),
    requireEmailForPhoneUsers: z.boolean().default(true),

    firebase: tenantFirebaseConfigSchema.optional(),
    firebaseRedirectDomain: z.string().optional(),
    firebaseDynamicLinkDomain: z.string().optional(),

    web3Auth: tenantWeb3AuthConfigSchema.optional(),
    allowedSignInMethods: z.array(z.string()).optional(),
}).passthrough();

const deleteSuccessStylesSchema = z.object({
    containerClass: z.string(),
    statusBarColor: z.string(),
});

export const tenantBrandingConfigSchema = z.object({
    name: z.string().default('LearnCard'),
    shortName: z.string().optional(),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
    defaultTheme: z.string().default('colorful'),
    allowedThemes: z.array(z.string()).optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    fontFamily: z.string().optional(),
    loginRedirectPath: z.string().default('/waitingsofa?loginCompleted=true'),
    brandingKey: z.string().optional(),
    headerText: z.string().optional(),
    homeRoute: z.string().optional(),

    // Asset URLs — when set, these override the bundled LearnCard images.
    // Relative paths resolve against the app's public directory; absolute
    // URLs (https://) are used as-is.
    textLogoUrl: z.string().optional(),
    brandMarkUrl: z.string().optional(),
    appIconUrl: z.string().optional(),
    desktopLoginBgUrl: z.string().optional(),
    desktopLoginBgAltUrl: z.string().optional(),

    categoryLabels: z.record(z.string(), z.string()).optional(),
    categoryColors: z.record(z.string(), z.string()).optional(),
    navBarColors: z.record(z.string(), z.string()).optional(),
    statusBarColors: z.record(z.string(), z.string()).optional(),
    headerTextColors: z.record(z.string(), z.string()).optional(),
    defaultHeaderTextColor: z.string().optional(),

    iconPalettes: z.record(
        z.string(),
        z.object({
            primary: z.string(),
            primaryLight: z.string().optional(),
            accent: z.string().optional(),
            stroke: z.string().optional(),
        }).partial(),
    ).optional(),

    deleteSuccessStyles: deleteSuccessStylesSchema.optional(),
}).passthrough();

export const tenantFeatureConfigSchema = z.object({
    aiFeatures: z.boolean().default(true),
    appStore: z.boolean().default(true),
    analytics: z.boolean().default(true),
    themeSwitching: z.boolean().default(true),
    introSlides: z.boolean().default(true),
}).passthrough();

export const tenantObservabilityConfigSchema = z.object({
    sentryDsn: z.string().optional(),
    sentryEnv: z.string().optional(),
    sentryTraceDomains: z.array(z.string()).optional(),
    launchDarklyClientId: z.string(),
    userflowToken: z.string(),
    googleMapsApiKey: z.string().optional(),

    analyticsProvider: z.enum(['posthog', 'firebase', 'noop']).default('noop'),
    posthogKey: z.string().optional(),
    posthogHost: z.string().optional(),
}).passthrough();

export const tenantLinksConfigSchema = z.object({
    appStoreUrl: z.string().optional(),
    playStoreUrl: z.string().optional(),
    externalAuthRedirectBase: z.string().optional(),
}).passthrough();

export const tenantNativeConfigSchema = z.object({
    bundleId: z.string(),
    displayName: z.string(),
    deepLinkDomains: z.array(z.string()),
    customSchemes: z.array(z.string()).optional(),
    capgoChannel: z.string().optional(),
    iconSource: z.string().optional(),
    splashSource: z.string().optional(),
}).passthrough();

export const tenantEcosystemConfigSchema = z.object({
    ecosystemId: z.string().optional(),
    rootOrgId: z.string().optional(),
}).passthrough();

// -----------------------------------------------------------------
// Schema version — bump when making breaking changes to the config shape.
// Used by resolveTenantConfig() to invalidate stale caches.
// -----------------------------------------------------------------

export const TENANT_CONFIG_SCHEMA_VERSION = 1;

// -----------------------------------------------------------------
// Root schema
// -----------------------------------------------------------------

export const tenantConfigSchema = z.object({
    schemaVersion: z.number().default(TENANT_CONFIG_SCHEMA_VERSION),
    tenantId: z.string(),
    domain: z.string(),
    devDomain: z.string().optional(),

    apis: tenantApiConfigSchema,
    auth: tenantAuthConfigSchema,
    branding: tenantBrandingConfigSchema,
    features: tenantFeatureConfigSchema,
    observability: tenantObservabilityConfigSchema,
    links: tenantLinksConfigSchema,

    native: tenantNativeConfigSchema.optional(),
    ecosystem: tenantEcosystemConfigSchema.optional(),
}).passthrough();

// -----------------------------------------------------------------
// Inferred types
// -----------------------------------------------------------------

export type TenantConfig = z.infer<typeof tenantConfigSchema>;

export type TenantApiConfig = z.infer<typeof tenantApiConfigSchema>;
export type TenantAuthConfig = z.infer<typeof tenantAuthConfigSchema>;
export type TenantFirebaseConfig = z.infer<typeof tenantFirebaseConfigSchema>;
export type TenantWeb3AuthConfig = z.infer<typeof tenantWeb3AuthConfigSchema>;
export type TenantBrandingConfig = z.infer<typeof tenantBrandingConfigSchema>;
export type TenantFeatureConfig = z.infer<typeof tenantFeatureConfigSchema>;
export type TenantObservabilityConfig = z.infer<typeof tenantObservabilityConfigSchema>;
export type TenantLinksConfig = z.infer<typeof tenantLinksConfigSchema>;
export type TenantNativeConfig = z.infer<typeof tenantNativeConfigSchema>;
export type TenantEcosystemConfig = z.infer<typeof tenantEcosystemConfigSchema>;

// -----------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------

/**
 * Parse and validate a raw config object. Returns the validated config
 * with defaults applied, or null + logs errors.
 */
export const parseTenantConfig = (raw: unknown, source: string): TenantConfig | null => {
    const result = tenantConfigSchema.safeParse(raw);

    if (result.success) {
        return result.data;
    }

    console.warn(
        `[TenantConfig] Invalid config from ${source}:`,
        result.error.issues.map((i: ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')
    );

    return null;
};

/**
 * Parse a partial config (e.g. from an edge function that only sends overrides).
 * Uses `.partial()` on the root so top-level sections are optional.
 */
export const parsePartialTenantConfig = (raw: unknown, source: string): Partial<TenantConfig> | null => {
    const partialSchema = tenantConfigSchema.partial();
    const result = partialSchema.safeParse(raw);

    if (result.success) {
        return result.data as Partial<TenantConfig>;
    }

    console.warn(
        `[TenantConfig] Invalid partial config from ${source}:`,
        result.error.issues.map((i: ZodIssue) => `${i.path.join('.')}: ${i.message}`).join(', ')
    );

    return null;
};
