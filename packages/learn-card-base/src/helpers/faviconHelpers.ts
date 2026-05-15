/**
 * Hostname extraction safe against malformed URLs. Returns
 * `undefined` when the URL can't be parsed so callers can skip
 * rendering the affected affordance instead of crashing.
 */
export const extractDomain = (url: string | undefined): string | undefined => {
    if (!url) return undefined;
    try {
        return new URL(url).host;
    } catch {
        return undefined;
    }
};

/**
 * Low-level Google s2 favicon URL builder. Used in the issuer /
 * verifier avatar chain (after metadata `display.logo.uri`, before
 * the gradient initials fallback).
 *
 * We deliberately use the s2 endpoint instead of the hosted
 * `/favicon.ico` because:
 *   1. It rasterizes regardless of the issuer's icon format
 *   2. It serves at a requested size (no scaling artifacts)
 *   3. It tolerates issuers that don't host a favicon at all (returns
 *      a neutral globe — same as our final fallback would do)
 *   4. It bypasses the cross-origin/CORB issues you hit reading
 *      `<link rel="icon">` from a third-party HTML response
 */
export const faviconUrl = (
    domain: string | undefined,
    sizePx = 128
): string | undefined => {
    if (!domain) return undefined;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
        domain
    )}&sz=${sizePx}`;
};

/**
 * Extract the apex (registrable) domain for a host, returning
 * `undefined` when there's no meaningful apex distinct from the
 * input. OID4VC issuers and verifiers very frequently use admin
 * subdomains (`issuer.demo.walt.id`, `verifier.eudiw.dev`, `vci.
 * issuer.example.com`) that don't host a favicon, while the apex
 * does — so the avatar chain should target the apex.
 *
 * Heuristic: take the last two dot-separated labels. Returns
 * `undefined` when:
 *  - host is missing
 *  - host is an IPv4 address (no apex concept applies)
 *  - host has fewer than 3 labels (already at the apex; falling back
 *    would request the same favicon twice)
 *
 * LIMITATIONS — public-suffix-list (PSL) cases like `example.co.uk`
 * incorrectly collapse to `co.uk` here, which 404s on the favicon
 * service and falls through to the gradient. Acceptable degradation
 * for v1; swap in a real PSL implementation if production telemetry
 * shows it biting common issuer hosts.
 */
export const apexDomain = (host: string | undefined): string | undefined => {
    if (!host) return undefined;
    const hostOnly = host.split(':')[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostOnly)) return undefined;
    const parts = hostOnly.split('.').filter(Boolean);
    if (parts.length < 3) return undefined;
    return parts.slice(-2).join('.');
};

/**
 * Single apex-preferring favicon URL for a host. Google's s2
 * favicon service returns 200 + a generic globe (not 404) for hosts
 * with no favicon, so an `<img onError>`-driven multi-URL chain
 * wouldn't actually advance — the request "succeeds" with a
 * placeholder. Going apex-first picks the parent brand on first
 * paint, which is what we actually want for OID4VC admin subdomains
 * (`issuer.demo.walt.id` → `walt.id`).
 *
 * Falls back to the literal host when no meaningful apex exists
 * (single-label hosts, IPs, localhost). Returns `undefined` only
 * when the host itself is missing.
 */
export const preferredFaviconUrl = (
    host: string | undefined,
    sizePx = 128
): string | undefined => {
    if (!host) return undefined;
    const target = apexDomain(host) ?? host;
    return faviconUrl(target, sizePx);
};
