/**
 * Server-side tenant resolution for brain-service and lca-api.
 *
 * Resolution order (first match wins):
 *   1. Explicit `X-Tenant-Id` header — native apps, any client that knows its tenant
 *   2. `Origin` / `Referer` header hostname — web apps (e.g. alpha.vetpass.app → vetpass)
 *   3. `DEFAULT_TENANT_ID` env var — per-tenant deploys, cron jobs, server-to-server
 *   4. Fallback to 'learncard'
 *
 * The registry maps tenant IDs to email branding overrides. Missing fields
 * fall back to LearnCard defaults via `resolveBranding()`.
 */

import type { TenantBranding } from './branding';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ResolvedTenant {
    /** Canonical tenant identifier, e.g. 'vetpass', 'learncard'. */
    id: string;

    /** Partial email branding — pass to `resolveBranding()` for full defaults. */
    emailBranding: Partial<TenantBranding>;

    /** How the tenant was resolved — useful for logging / debugging. */
    resolvedVia: 'header' | 'origin' | 'env' | 'default';
}

export interface RequestHeaders {
    /** Value of the X-Tenant-Id header. */
    'x-tenant-id'?: string | undefined;

    /** Origin header (e.g. "https://alpha.vetpass.app"). */
    origin?: string | undefined;

    /** Referer header (fallback for Origin). */
    referer?: string | undefined;

    [key: string]: string | string[] | undefined;
}

// ---------------------------------------------------------------------------
// Origin → tenant ID mapping
//
// Add new entries when a tenant gets a web deployment.
// Supports exact hostname match and wildcard subdomains.
// ---------------------------------------------------------------------------

const ORIGIN_MAP: Record<string, string> = {
    // VetPass
    'vetpass.app': 'vetpass',
    'alpha.vetpass.app': 'vetpass',
    'staging.vetpass.app': 'vetpass',

    // LearnCard
    'learncard.app': 'learncard',
    'staging.learncard.app': 'learncard',
    'app.learncard.com': 'learncard',

    // Local dev
    'localhost': 'learncard',
};

// ---------------------------------------------------------------------------
// Tenant email branding registry
//
// Only override fields that differ from LearnCard defaults.
// Missing fields → resolveBranding() fills in DEFAULT_BRANDING.
// ---------------------------------------------------------------------------

const TENANT_EMAIL_BRANDING: Record<string, Partial<TenantBranding>> = {
    learncard: {},

    vetpass: {
        brandName: 'VetPass',
        logoUrl: 'https://vetpass.app/assets/icon/icon.png',
        logoAlt: 'VetPass',
        primaryColor: '#1B5E20',
        primaryTextColor: '#ffffff',
        supportEmail: 'support@vetpass.app',
        websiteUrl: 'https://www.vetpass.app',
        appUrl: 'https://vetpass.app',
        fromDomain: 'vetpass.app',
        copyrightHolder: 'VetPass',
    },
};

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

/**
 * Extract a hostname from a URL string. Returns undefined if parsing fails.
 */
const extractHostname = (urlString: string): string | undefined => {
    try {
        return new URL(urlString).hostname;
    } catch {
        return undefined;
    }
};

/**
 * Look up tenant ID from a hostname, checking exact match first,
 * then stripping subdomains progressively (e.g. "foo.bar.vetpass.app" → "vetpass.app").
 */
const tenantIdFromHostname = (hostname: string): string | undefined => {
    if (ORIGIN_MAP[hostname]) return ORIGIN_MAP[hostname];

    // Strip subdomains: "alpha.vetpass.app" → "vetpass.app"
    const parts = hostname.split('.');

    for (let i = 1; i < parts.length - 1; i++) {
        const parent = parts.slice(i).join('.');

        if (ORIGIN_MAP[parent]) return ORIGIN_MAP[parent];
    }

    return undefined;
};

/**
 * Resolve the tenant from HTTP request headers.
 *
 * @param headers — Request headers object. Accepts plain objects, Node IncomingHttpHeaders, etc.
 * @param envTenantId — Override for `process.env.DEFAULT_TENANT_ID` (useful for testing).
 */
export const resolveTenantFromRequest = (
    headers: RequestHeaders,
    envTenantId?: string,
): ResolvedTenant => {
    // 1. Explicit X-Tenant-Id header (native apps, any informed client)
    const explicit = normalizeHeader(headers['x-tenant-id']);

    if (explicit) {
        return buildTenant(explicit, 'header');
    }

    // 2. Origin / Referer header (web apps)
    const origin = normalizeHeader(headers.origin) || normalizeHeader(headers.referer);

    if (origin) {
        const hostname = extractHostname(origin);

        if (hostname) {
            const matched = tenantIdFromHostname(hostname);

            if (matched) {
                return buildTenant(matched, 'origin');
            }
        }
    }

    // 3. Deploy-level env var
    const envDefault = envTenantId ?? process.env.DEFAULT_TENANT_ID;

    if (envDefault) {
        return buildTenant(envDefault, 'env');
    }

    // 4. Safe default
    return buildTenant('learncard', 'default');
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const normalizeHeader = (value: string | string[] | undefined): string | undefined => {
    if (Array.isArray(value)) return value[0];

    return value || undefined;
};

const buildTenant = (id: string, resolvedVia: ResolvedTenant['resolvedVia']): ResolvedTenant => ({
    id,
    emailBranding: TENANT_EMAIL_BRANDING[id] ?? {},
    resolvedVia,
});

// ---------------------------------------------------------------------------
// Admin helpers (for extending the registry at runtime via env vars)
// ---------------------------------------------------------------------------

/**
 * Register additional origin → tenant mappings at startup.
 * Useful for dev/staging domains configured via env vars.
 */
export const registerOriginMapping = (hostname: string, tenantId: string): void => {
    ORIGIN_MAP[hostname] = tenantId;
};

/**
 * Register or update email branding for a tenant at startup.
 * Merges with any existing branding (does not replace).
 */
export const registerTenantBranding = (tenantId: string, branding: Partial<TenantBranding>): void => {
    TENANT_EMAIL_BRANDING[tenantId] = {
        ...TENANT_EMAIL_BRANDING[tenantId],
        ...branding,
    };
};
