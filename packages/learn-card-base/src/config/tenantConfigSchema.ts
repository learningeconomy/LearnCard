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

/**
 * URL string that also accepts `TODO_*` sentinel placeholders.
 *
 * Tenant configs under development use `TODO_BRAIN_SERVICE_URL` etc. as
 * placeholders. The validate-tenant-configs script flags these as warnings.
 * Using raw `.url()` would reject them at schema level, which is too strict
 * for draft configs.
 */
const urlOrPlaceholder = () =>
    z.string().refine(val => val.startsWith('TODO_') || z.string().url().safeParse(val).success, {
        message: 'Invalid URL (TODO_* placeholders are allowed)',
    });

// -----------------------------------------------------------------
// Sub-schemas
// -----------------------------------------------------------------

export const tenantApiConfigSchema = z
    .object({
        brainService: urlOrPlaceholder(),
        brainServiceApi: urlOrPlaceholder(),
        cloudService: urlOrPlaceholder(),
        lcaApi: urlOrPlaceholder(),
        xapi: urlOrPlaceholder().optional(),
        notificationsEndpoint: urlOrPlaceholder().optional(),
        aiService: urlOrPlaceholder().optional(),
        corsProxyApiKey: z.string().optional(),
    })
    .passthrough();

export const tenantFirebaseConfigSchema = z
    .object({
        apiKey: z.string(),
        authDomain: z.string(),
        projectId: z.string(),
        storageBucket: z.string(),
        messagingSenderId: z.string(),
        appId: z.string(),
        measurementId: z.string().optional(),
        redirectDomain: z.string().optional(),
        dynamicLinkDomain: z.string().optional(),
    })
    .passthrough();

export const tenantSSSConfigSchema = z
    .object({
        serverUrl: urlOrPlaceholder().default('https://api.learncard.app/trpc'),
        escrowRelayPublicKey: z.string().default(''),
        escrowRelayKeyId: z.string().default(''),
        enableEmailBackupShare: z.boolean().default(true),
        requireEmailForPhoneUsers: z.boolean().default(true),
    })
    .passthrough();

export const tenantWeb3AuthConfigSchema = z
    .object({
        clientId: z.string(),
        network: z.string(),
        verifierId: z.string(),
        rpcTarget: z.string().default('https://rpc.ankr.com/eth'),
    })
    .passthrough();

export const tenantAuthConfigSchema = z
    .object({
        // Open strings — must match a registered factory in providerRegistry.ts.
        provider: z.string().default('firebase'),
        keyDerivation: z.string().default('sss'),
        sssCohortEnabled: z.boolean().default(false),

        // Provider-specific config blocks — only the one matching `provider`
        // is used at runtime. Each block is self-contained with its own schema.
        // Unknown providers pass through via the parent .passthrough().
        firebase: tenantFirebaseConfigSchema.optional(),

        // Key-derivation strategy config blocks — only the one matching
        // `keyDerivation` is used at runtime.
        sss: tenantSSSConfigSchema.optional(),
        web3Auth: tenantWeb3AuthConfigSchema.optional(),
    })
    .passthrough()
    .superRefine((auth, context) => {
        if (auth.provider === 'firebase' && !auth.firebase) {
            context.addIssue({
                code: 'custom',
                path: ['firebase'],
                message: 'Required when auth.provider is firebase',
            });
        }

        if (auth.keyDerivation === 'sss' && !auth.sss) {
            context.addIssue({
                code: 'custom',
                path: ['sss'],
                message: 'Required when auth.keyDerivation is sss',
            });
        }

        if (auth.keyDerivation === 'web3auth' && !auth.web3Auth) {
            context.addIssue({
                code: 'custom',
                path: ['web3Auth'],
                message: 'Required when auth.keyDerivation is web3auth',
            });
        }
    });

export const tenantFilestackStorageConfigSchema = z
    .object({
        provider: z.literal('filestack'),
        apiKey: z.string().default('A7RsW3VzfSNO2TCsFJ6Eiz'),
        cdnDomain: z.string().default('cdn.filestackcontent.com'),
        apiDomain: z.string().default('www.filestackapi.com'),
    })
    .passthrough();

export const tenantS3StorageConfigSchema = z
    .object({
        provider: z.literal('s3'),
        uploadEndpoint: urlOrPlaceholder(),
        cdnDomain: z.string(),
        bucket: z.string().optional(),
    })
    .passthrough();

export const tenantStorageConfigSchema = z.discriminatedUnion('provider', [
    tenantFilestackStorageConfigSchema,
    tenantS3StorageConfigSchema,
]);

const deleteSuccessStylesSchema = z
    .object({
        containerClass: z.string(),
        statusBarColor: z.string(),
    })
    .passthrough();

export const tenantBrandingConfigSchema = z
    .object({
        name: z.string().default('LearnCard'),
        shortName: z.string().optional(),
        logoUrl: z.string().optional(),
        faviconUrl: z.string().optional(),
        defaultTheme: z.string().default('colorful'),
        allowedThemes: z.array(z.string()).optional(),
        loginRedirectPath: z.string().default('/waitingsofa?loginCompleted=true'),
        brandingKey: z.string().optional(),
        headerText: z.string().optional(),
        homeRoute: z.string().optional(),

        // Asset URLs — when set, these override the bundled LearnCard images.
        // Relative paths resolve against the app's public directory; absolute
        // URLs (https://) are used as-is.
        textLogoUrl: z.string().optional(),
        textLogoDarkUrl: z.string().optional(),
        brandMarkUrl: z.string().optional(),
        brandMarkLightUrl: z.string().optional(),
        appIconUrl: z.string().optional(),
        desktopLoginBgUrl: z.string().optional(),
        desktopLoginBgAltUrl: z.string().optional(),
        fullLogoUrl: z.string().optional(),
        fullLogoDarkUrl: z.string().optional(),

        categoryLabels: z.record(z.string(), z.string()).optional(),
        categoryColors: z.record(z.string(), z.string()).optional(),
        navBarColors: z.record(z.string(), z.string()).optional(),
        statusBarColors: z.record(z.string(), z.string()).optional(),
        headerTextColors: z.record(z.string(), z.string()).optional(),
        defaultHeaderTextColor: z.string().optional(),

        iconPalettes: z
            .record(
                z.string(),
                z.object({
                    primary: z.string(),
                    primaryLight: z.string().optional(),
                    accent: z.string().optional(),
                    stroke: z.string().optional(),
                })
            )
            .optional(),

        deleteSuccessStyles: deleteSuccessStylesSchema.optional(),
    })
    .passthrough();

export const tenantFeatureConfigSchema = z
    .object({
        aiFeatures: z.boolean().default(true),
        appStore: z.boolean().default(true),
        analytics: z.boolean().default(true),
        themeSwitching: z.boolean().default(true),
        introSlides: z.boolean().default(true),
        launchPadQuickActions: z.boolean().default(true),

        /**
         * Pathways v2 — greenfield experimental feature at `/pathways`.
         * Default off. See `apps/learn-card-app/src/pages/pathways/docs/architecture.md`.
         */
        pathways: z.boolean().default(false),

        /**
         * Dashboard home — makes `/dashboard` the post-login landing route and the
         * first side-menu entry instead of the Passport (`/wallet`) home.
         */
        dashboardHome: z.boolean().default(false),

        /**
         * Fetch global skill frameworks from the backend's seeded fixtures instead
         * of LaunchDarkly flags. Only seeded backends (local + staging) host them,
         * so this MUST track `apis.brainService`: keep `false` for production configs,
         * set `true` in the `config.local.json` / `config.staging.json` overlays.
         */
        useSeededSkillFrameworks: z.boolean().default(false),
    })
    .passthrough();

export const tenantObservabilityConfigSchema = z
    .object({
        sentryDsn: z.string().optional(),
        sentryEnv: z.string().optional(),
        sentryTraceDomains: z.array(z.string()).optional(),
        launchDarklyClientId: z.string().default(''),
        userflowToken: z.string().default(''),
        googleMapsApiKey: z.string().optional(),

        analyticsProvider: z.enum(['posthog', 'firebase', 'noop']).default('noop'),
        posthogKey: z.string().optional(),
        posthogHost: urlOrPlaceholder().optional(),
    })
    .passthrough();

export const tenantLinksConfigSchema = z
    .object({
        appStoreUrl: urlOrPlaceholder().optional(),
        playStoreUrl: urlOrPlaceholder().optional(),
        externalAuthRedirectBase: urlOrPlaceholder().optional(),

        // Legal / informational links.
        // When omitted, the app auto-generates a dynamic branded URL:
        //   e.g. https://learncard.com/legal/<tenantId>/terms
        // Set explicitly to override with a fully custom page.
        termsOfServiceUrl: urlOrPlaceholder().optional(),
        privacyPolicyUrl: urlOrPlaceholder().optional(),
        contactUrl: urlOrPlaceholder().optional(),
        websiteUrl: urlOrPlaceholder().optional(),
    })
    .passthrough();

export const tenantNativeConfigSchema = z
    .object({
        bundleId: z.string(),
        displayName: z.string(),
        deepLinkDomains: z.array(z.string()),
        customSchemes: z.array(z.string()).optional(),
    })
    .passthrough();

/**
 * Email / SMS delivery branding.
 *
 * When present, the delivery adapters in brain-service and lca-api render
 * emails locally via @learncard/email-templates using these values.
 * Every field is optional — missing fields fall back to LearnCard defaults.
 */
export const tenantEmailConfigSchema = z
    .object({
        brandName: z.string().optional(),
        logoUrl: z.string().optional(),
        logoAlt: z.string().optional(),
        primaryColor: z.string().optional(),
        primaryTextColor: z.string().optional(),
        supportEmail: z.string().optional(),
        websiteUrl: z.string().optional(),
        appUrl: z.string().optional(),
        fromDomain: z.string().optional(),
        copyrightHolder: z.string().optional(),
    })
    .passthrough();

export const tenantI18nConfigSchema = z
    .object({
        defaultLanguage: z.string().default('en'),
        supportedLanguages: z.array(z.string()).default(['en']),
    })
    .passthrough();

/** @planned — ecosystem fields reserved for multi-tenant org hierarchy support */
export const tenantEcosystemConfigSchema = z
    .object({
        ecosystemId: z.string().optional(),
        rootOrgId: z.string().optional(),
    })
    .passthrough();

/**
 * External badge-pack registries a tenant pulls in. A badge pack is a single JSON
 * document of shape { categories: BadgeGroup[]; badges: LCAStylesPackRegistryEntry[] }.
 * `badgePackUrls` are remote JSON files; `badgePackAssets` are names of bundled files
 * shipped with the app (apps/learn-card-app/src/registries/badge-packs/<name>.json).
 * All sources merge (remote then bundled): badges deduped by category+type, categories
 * by id, later source wins per field.
 */
export const tenantRegistriesConfigSchema = z
    .object({
        badgePackUrls: z.array(z.string()).default([]),
        badgePackAssets: z.array(z.string()).default([]),
    })
    .passthrough();

// -----------------------------------------------------------------
// Schema version — bump when making breaking changes to the config shape.
// Used by resolveTenantConfig() to invalidate stale caches.
// -----------------------------------------------------------------

export const TENANT_CONFIG_SCHEMA_VERSION = 1;

// -----------------------------------------------------------------
// Root schema
// -----------------------------------------------------------------

export const tenantConfigSchema = z
    .object({
        schemaVersion: z.number().default(TENANT_CONFIG_SCHEMA_VERSION),
        tenantId: z.string(),
        domain: z.string(),
        devDomain: z.string().optional(),

        apis: tenantApiConfigSchema,
        auth: tenantAuthConfigSchema,
        storage: tenantStorageConfigSchema.default({
            provider: 'filestack',
            apiKey: 'A7RsW3VzfSNO2TCsFJ6Eiz',
            cdnDomain: 'cdn.filestackcontent.com',
            apiDomain: 'www.filestackapi.com',
        }),
        branding: tenantBrandingConfigSchema,
        features: tenantFeatureConfigSchema,
        observability: tenantObservabilityConfigSchema,
        links: tenantLinksConfigSchema,
        i18n: tenantI18nConfigSchema.optional(),

        email: tenantEmailConfigSchema.optional(),
        native: tenantNativeConfigSchema.optional(),
        ecosystem: tenantEcosystemConfigSchema.optional(),
        registries: tenantRegistriesConfigSchema.default({}),
    })
    .passthrough();

// -----------------------------------------------------------------
// Inferred types
// -----------------------------------------------------------------

export type TenantConfig = z.infer<typeof tenantConfigSchema>;

export type TenantApiConfig = z.infer<typeof tenantApiConfigSchema>;
export type TenantAuthConfig = z.infer<typeof tenantAuthConfigSchema>;
export type TenantFirebaseConfig = z.infer<typeof tenantFirebaseConfigSchema>;
export type TenantWeb3AuthConfig = z.infer<typeof tenantWeb3AuthConfigSchema>;
export type TenantStorageConfig = z.infer<typeof tenantStorageConfigSchema>;
export type TenantFilestackStorageConfig = z.infer<typeof tenantFilestackStorageConfigSchema>;
export type TenantS3StorageConfig = z.infer<typeof tenantS3StorageConfigSchema>;
export type TenantBrandingConfig = z.infer<typeof tenantBrandingConfigSchema>;
export type TenantFeatureConfig = z.infer<typeof tenantFeatureConfigSchema>;
export type TenantObservabilityConfig = z.infer<typeof tenantObservabilityConfigSchema>;
export type TenantLinksConfig = z.infer<typeof tenantLinksConfigSchema>;
export type TenantNativeConfig = z.infer<typeof tenantNativeConfigSchema>;
export type TenantEmailConfig = z.infer<typeof tenantEmailConfigSchema>;
export type TenantI18nConfig = z.infer<typeof tenantI18nConfigSchema>;
export type TenantEcosystemConfig = z.infer<typeof tenantEcosystemConfigSchema>;

// -----------------------------------------------------------------
// Validation helpers
// -----------------------------------------------------------------

export class TenantConfigValidationError extends Error {
    readonly source: string;

    readonly issues: readonly ZodIssue[];

    constructor(source: string, issues: readonly ZodIssue[]) {
        const details = issues
            .map(issue => {
                const path = issue.path.length ? issue.path.map(String).join('.') : '(config)';

                return `${path}\n  ${issue.message}`;
            })
            .join('\n\n');

        super(`Invalid TenantConfig from ${source}\n\n${details}`);
        this.name = 'TenantConfigValidationError';
        this.source = source;
        this.issues = issues;
    }
}

const parseWithSource = <Schema extends z.ZodType>(
    schema: Schema,
    raw: unknown,
    source: string
): z.output<Schema> => {
    const result = schema.safeParse(raw);

    if (result.success) return result.data;

    throw new TenantConfigValidationError(source, result.error.issues);
};

/** Parse and validate a complete tenant config. Invalid explicit config throws. */
export const parseTenantConfig = (raw: unknown, source: string): TenantConfig =>
    parseWithSource(tenantConfigSchema, raw, source);

/** Parse and validate a root-level tenant overlay. Invalid explicit config throws. */
const partialTenantConfigSchema = tenantConfigSchema.partial();

export const parsePartialTenantConfig = (raw: unknown, source: string): Partial<TenantConfig> =>
    parseWithSource(partialTenantConfigSchema, raw, source);
