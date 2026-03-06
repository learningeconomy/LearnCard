/**
 * Netlify Edge Function: tenant-config
 *
 * Resolves a TenantConfig JSON based on the incoming request's hostname.
 * The client-side `resolveTenantConfig()` fetches from `/__tenant-config`
 * and uses the result to configure the app.
 *
 * Hostname → TenantConfig mapping:
 *   - For known hostnames, returns the baked config for that tenant.
 *   - For unknown hostnames, returns the default LearnCard config.
 *
 * Response is cached at the edge for 5 minutes with a 1-hour stale-while-revalidate.
 */

import type { Context } from 'https://edge.netlify.com';

// ---------------------------------------------------------------------------
// Tenant registry
// ---------------------------------------------------------------------------

interface TenantEntry {
    tenantId: string;
    domain: string;
    // Only include overrides that differ from the default LearnCard config.
    // The client merges these on top of DEFAULT_LEARNCARD_TENANT_CONFIG.
    configOverrides?: Record<string, unknown>;
}

/**
 * Map of hostname → tenant entry.
 *
 * To add a new tenant:
 *   1. Add an entry here with the production hostname as key.
 *   2. Optionally add configOverrides for any values that differ from defaults.
 *   3. Deploy — the edge function will start serving that tenant's config.
 */
const TENANT_REGISTRY: Record<string, TenantEntry> = {
    'learncard.app': {
        tenantId: 'learncard',
        domain: 'learncard.app',
    },

    'learncardapp.netlify.app': {
        tenantId: 'learncard',
        domain: 'learncard.app',
    },

    // Example: future tenant
    // 'scoutpass.org': {
    //     tenantId: 'scoutpass',
    //     domain: 'scoutpass.org',
    //     configOverrides: {
    //         branding: {
    //             appName: 'ScoutPass',
    //             brandingKey: 'scoutPass',
    //             defaultTheme: 'Formal',
    //         },
    //     },
    // },
};

// Default tenant when hostname is not recognized
const DEFAULT_TENANT: TenantEntry = {
    tenantId: 'learncard',
    domain: 'learncard.app',
};

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

export default async (request: Request, _context: Context) => {
    const url = new URL(request.url);
    const hostname = url.hostname;

    const tenant = TENANT_REGISTRY[hostname] ?? DEFAULT_TENANT;

    const responseBody = {
        tenantId: tenant.tenantId,
        domain: tenant.domain,
        ...(tenant.configOverrides ?? {}),
    };

    return new Response(JSON.stringify(responseBody), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
            'Access-Control-Allow-Origin': '*',
        },
    });
};

export const config = {
    path: '/__tenant-config',
};
