const UPSTREAM_URL = 'https://www.scout.org/api/news';
const TIMEOUT_MS = 8_000;

const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, sentry-trace, baggage',
    'Access-Control-Max-Age': '86400',
    'Cache-Control': 'no-store',
};

const errorResponse = (status: number, error: string) =>
    new Response(JSON.stringify({ error }), { status, headers });

export default async (request: Request): Promise<Response> => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...headers, Allow: 'GET, OPTIONS' },
        });
    }
    // This endpoint serves one public feed, never a caller-supplied URL or page.
    if (new URL(request.url).search)
        return errorResponse(400, 'Query parameters are not supported');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const upstream = await fetch(UPSTREAM_URL, {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        });
        if (!upstream.ok) return errorResponse(502, 'Scout news is unavailable');

        const news = await upstream.json();
        if (
            !Array.isArray(news?.data) ||
            !Number.isFinite(news?.pager?.pages) ||
            !Number.isFinite(news?.pager?.current_page)
        ) {
            return errorResponse(502, 'Invalid Scout news response');
        }

        return new Response(JSON.stringify(news), {
            headers: {
                ...headers,
                'Cache-Control': 'public, max-age=300',
                'Netlify-CDN-Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
            },
        });
    } catch {
        return errorResponse(controller.signal.aborted ? 504 : 502, 'Scout news is unavailable');
    } finally {
        clearTimeout(timeout);
    }
};

// Both this opt-in and the response cache headers are required for CDN caching.
export const config = { path: '/api/scout-news', cache: 'manual' };
