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
// Shared tenant registry (imported as a module so Netlify's bundler includes it)
//
// Netlify edge functions run in an isolated Deno sandbox WITHOUT filesystem
// access, so we import the JSON directly rather than using Deno.readTextFileSync.
// ---------------------------------------------------------------------------

// @ts-expect-error — Deno JSON import assertion; Netlify's bundler resolves this
import registryData from '../../environments/tenant-registry.json' assert { type: 'json' };

interface TenantEntry {
    tenantId: string;
    domain: string;
    configOverrides?: Record<string, unknown>;
}

interface TenantRegistry {
    hostnames: Record<string, TenantEntry>;
    defaultTenant: TenantEntry;
}

const registry: TenantRegistry = registryData as TenantRegistry;

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
