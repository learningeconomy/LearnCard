/**
 * Trusted origins whitelist for CORS and post-message security.
 * These origins are allowed to communicate with the LearnCard application.
 *
 * Netlify static headers cannot express dynamic multi-origin CORS,
 * so the server-level CORS policy is enforced by removing wildcard
 * headers in netlify.toml and relying on browser same-origin policy.
 * Application-level cross-origin trust (postMessage) is validated
 * against this whitelist at runtime.
 */

export const TRUSTED_ORIGINS = [
    'https://learncard.app',
    'https://computer8004.github.io',
    'http://localhost:3000',
    'https://localhost:3000',
    'https://staging.learncard.app',
    'https://deploy-preview--learncard-app.netlify.app',
] as const;

export type TrustedOrigin = (typeof TRUSTED_ORIGINS)[number];

/**
 * Check if an origin is in the trusted whitelist.
 */
export function isTrustedOrigin(origin: string): boolean {
    return TRUSTED_ORIGINS.includes(origin as TrustedOrigin);
}

/**
 * Check if an origin matches a trusted pattern (e.g. staging subdomains).
 */
export function isTrustedOriginPattern(origin: string): boolean {
    if (isTrustedOrigin(origin)) return true;

    try {
        const url = new URL(origin);
        // Allow any *.learncard.app subdomain
        if (url.hostname.endsWith('.learncard.app')) return true;
        // Allow Netlify deploy previews for learncard-app
        if (url.hostname.match(/^deploy-preview-\d+--learncard-app\.netlify\.app$/))
            return true;
    } catch {
        // Invalid URL
    }

    return false;
}
