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
// Debug info collected at init time
const _debug: { cwd: string; triedPaths: string[]; errors: string[]; foundPath: string | null } = {
    cwd: '',
    triedPaths: [],
    errors: [],
    foundPath: null,
};

const loadRegistry = (): TenantRegistry => {
    try {
        _debug.cwd = Deno.cwd();
    } catch (e) {
        _debug.cwd = `error: ${e}`;
    }

    // Also try to list what's in the cwd to understand the deploy layout
    try {
        const entries: string[] = [];

        for (const entry of Deno.readDirSync('.')) {
            entries.push(`${entry.isDirectory ? 'd' : 'f'}:${entry.name}`);
        }

        _debug.errors.push(`cwd-ls: ${entries.join(', ')}`);
    } catch (e) {
        _debug.errors.push(`cwd-ls-error: ${e}`);
    }

    const paths = [
        './apps/learn-card-app/environments/tenant-registry.json',
        './environments/tenant-registry.json',
        '../environments/tenant-registry.json',
        '/var/task/apps/learn-card-app/environments/tenant-registry.json',
    ];

    _debug.triedPaths = paths;

    for (const p of paths) {
        try {
            const text = Deno.readTextFileSync(p);
            _debug.foundPath = p;

            return JSON.parse(text) as TenantRegistry;
        } catch (e) {
            _debug.errors.push(`${p}: ${e instanceof Error ? e.message : String(e)}`);
        }
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
        _debug: {
            hostname,
            registryHostnames: Object.keys(registry.hostnames),
            ..._debug,
        },
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
