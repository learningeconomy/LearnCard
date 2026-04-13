/**
 * Shared CORS helpers for Netlify Edge Functions.
 *
 * Validates the incoming Origin header against the LearnCard trusted-origin
 * whitelist instead of emitting the dangerous "*" wildcard.
 */

/** Exact origins that are permitted for cross-origin requests. */
const ALLOWED_ORIGINS: string[] = [
    'https://learncard.app',
    'https://computer8004.github.io',
    'http://localhost:3000',
    'https://localhost:3000',
    'https://staging.learncard.app',
    'https://alpha.learncard.app',
    'https://beta.learncard.app',
    'https://deploy-preview--learncard-app.netlify.app',
];

/** Patterns used for dynamic origin matching. */
function isAllowedOriginPattern(origin: string): boolean {
    try {
        const url = new URL(origin);
        if (url.hostname.endsWith('.learncard.app')) return true;
        if (/^deploy-preview-\d+--learncard-app\.netlify\.app$/.test(url.hostname))
            return true;
    } catch {
        // Invalid URL – reject
    }
    return false;
}

/**
 * Determine the `Access-Control-Allow-Origin` value for a request.
 * Returns the request origin when it matches the whitelist, otherwise
 * returns `null` (no CORS header should be emitted).
 */
export function resolveAllowedOrigin(request: Request): string | null {
    const origin = request.headers.get('origin');
    if (!origin) return null;

    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (isAllowedOriginPattern(origin)) return origin;

    return null;
}

/**
 * Build CORS headers for an edge-function response.
 */
export function buildCorsHeaders(
    request: Request,
    extra: Record<string, string> = {}
): Record<string, string> {
    const allowedOrigin = resolveAllowedOrigin(request);
    const headers: Record<string, string> = { ...extra };

    if (allowedOrigin) {
        headers['Access-Control-Allow-Origin'] = allowedOrigin;
    }

    return headers;
}
