/**
 * Shared sanitization helpers for telemetry payloads.
 *
 * Every field that gets logged to Sentry, PostHog, Firebase, or any
 * other provider needs to pass through a filter that drops secrets,
 * query strings, user-provided PII, and anything else that isn't
 * explicitly safe. These helpers are the canonical place for those
 * filters — prefer extending this file over inlining `new URL(x).host`
 * at call sites so we have one place to audit if a leak is reported.
 */

/**
 * Sanitize a counterparty identifier (verifier `client_id`, issuer
 * URL, relying-party origin, ...) into a host-only or DID-method
 * string safe to log.
 *
 * Rules:
 *   - URL input → returns `host` (drops scheme, path, query, fragment,
 *     auth). Example: `https://verifier.example.com/wallet/v1?token=abc`
 *     → `verifier.example.com`.
 *   - DID input → returns the DID up to the first `?` or `#` (drops
 *     query/fragment service selectors). Example:
 *     `did:web:issuer.example.com?service=foo` → `did:web:issuer.example.com`.
 *   - Anything else → `undefined`. Better to lose the field than leak
 *     a token or opaque value of unknown shape.
 */
export const sanitizeCounterparty = (raw: string | undefined): string | undefined => {
    if (!raw) return undefined;

    try {
        const url = new URL(raw);
        return url.host || undefined;
    } catch {
        // Not a URL. Handle DIDs specially; drop everything else.
        if (raw.startsWith('did:')) {
            return raw.split('?')[0]?.split('#')[0];
        }
        return undefined;
    }
};
