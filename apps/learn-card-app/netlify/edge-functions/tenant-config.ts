/**
 * Netlify Edge Function: tenant-config
 *
 * Resolves a full TenantConfig JSON based on the incoming request's hostname.
 * The client-side `resolveTenantConfig()` fetches from `/__tenant-config`
 * and uses the result to configure the app.
 *
 * Config resolution is handled by the shared tenant-resolver module which
 * merges: base config → stage config → registry configOverrides.
 *
 * Response is cached at the edge for 5 minutes with a 1-hour stale-while-revalidate.
 */

import type { Context } from 'https://edge.netlify.com';

import { resolveTenantConfig } from './shared/tenant-resolver.ts';

// ---------------------------------------------------------------------------
// Edge function handler
// ---------------------------------------------------------------------------

export default async (request: Request, _context: Context) => {
    const url = new URL(request.url);
    const hostname = url.hostname;

    const resolvedConfig = resolveTenantConfig(hostname);

    return new Response(JSON.stringify(resolvedConfig), {
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
