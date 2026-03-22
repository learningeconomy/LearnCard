/**
 * Netlify Edge Function: tenant-config
 *
 * Resolves a TenantConfig JSON based on the incoming request's hostname.
 * The client-side `resolveTenantConfig()` fetches from `/__tenant-config`
 * and uses the result to configure the app.
 *
 * Hostname → TenantConfig mapping is driven by `environments/tenant-registry.json`
 * — the single source of truth shared between this edge function, build scripts,
 * and CI validation.
 *
 * Response is cached at the edge for 5 minutes with a 1-hour stale-while-revalidate.
 */

import type { Context } from 'https://edge.netlify.com';

// ---------------------------------------------------------------------------
// Shared tenant registry (loaded from environments/tenant-registry.json)
//
// Netlify edge functions run in Deno and can read files relative to the
// project root. The JSON is read at function init time and cached for
// the lifetime of the isolate.
// ---------------------------------------------------------------------------

interface TenantEntry {
    tenantId: string;
    domain: string;
    configOverrides?: Record<string, unknown>;
}

interface TenantRegistry {
    hostnames: Record<string, TenantEntry>;
    defaultTenant: TenantEntry;
}

/**
 * Load the shared tenant registry.
 *
 * In the Deno edge function runtime we read the JSON file that was deployed
 * alongside the site. The file lives at `environments/tenant-registry.json`
 * relative to the app root, which Netlify deploys from
 * `apps/learn-card-app/`.
 *
 * If the file cannot be read (e.g. local dev without the file), we fall back
 * to a minimal default registry.
 */
const loadRegistry = (): TenantRegistry => {
    try {
        // Netlify edge functions resolve relative paths from the site root.
        // Try multiple potential locations to be resilient to deploy layouts.
        const paths = [
            './environments/tenant-registry.json',
            '../environments/tenant-registry.json',
        ];

        for (const p of paths) {
            try {
                const text = Deno.readTextFileSync(p);

                return JSON.parse(text) as TenantRegistry;
            } catch {
                // Try next path
            }
        }
    } catch {
        // Fallthrough to default
    }

    // Fallback: minimal LearnCard-only registry
    return {
        hostnames: {
            'learncard.app': { tenantId: 'learncard', domain: 'learncard.app' },
            'learncardapp.netlify.app': { tenantId: 'learncard', domain: 'learncard.app' },
        },
        defaultTenant: { tenantId: 'learncard', domain: 'learncard.app' },
    };
};

const registry = loadRegistry();

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

export default async (request: Request, _context: Context) => {
    const url = new URL(request.url);
    const hostname = url.hostname;

    const tenant = registry.hostnames[hostname] ?? registry.defaultTenant;

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
