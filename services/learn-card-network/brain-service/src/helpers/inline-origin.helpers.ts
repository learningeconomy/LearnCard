/**
 * Inline-credential origin reconciliation.
 *
 * A partner emits two independent domain signals when they embed an inline
 * claim link on their site:
 *
 *   1. **Fetch origin** — the https origin that served the JSON. Brain-service
 *      observes this directly during `fetch()`, so it is cryptographically
 *      anchored to TLS and cannot be spoofed by the client.
 *
 *   2. **Presenting origin** — the origin the badge-claim.js SDK was loaded
 *      onto (`location.origin`), baked into the base64url payload by the SDK
 *      before the URL is shared via QR/copy-paste. Client-claimed and therefore
 *      spoofable in isolation.
 *
 * The two signals are reconciled via registrable-domain (eTLD+1, Public Suffix
 * List-aware) equivalence:
 *
 *   - If the presenting origin is absent or invalid, fall back to the fetch
 *     origin verbatim.
 *
 *   - If the fetch and presenting origins share an eTLD+1, promote the result
 *     to `https://{eTLD+1}` for a cleaner display (`storage.myapp.com` +
 *     `myapp.com` ⟶ `myapp.com`).
 *
 *   - If the eTLD+1 values differ, the presenting claim is rejected and we
 *     fall back to the fetch origin. This means an attacker who controls
 *     `attacker.com` cannot claim `presenting: harvard.edu` to escalate
 *     their apparent identity — the fetch origin stays authoritative.
 *
 * The resulting value is surfaced on the issued credential as
 * `credentialSubject.awardedByDomain`, providing a server-verified domain
 * identity alongside the partner's self-declared `issuer` / `awardedBy`.
 */

import { getDomain } from 'tldts';

export type ReconciliationMethod =
    | 'exact-match' // fetch and presenting share the same origin
    | 'etld1-promote' // same eTLD+1, different subdomains — promoted to eTLD+1
    | 'fetch-only' // presenting absent / unparseable
    | 'presenting-rejected'; // presenting parsed but eTLD+1 mismatch — ignored

export interface VerifiedAwardedByDomain {
    /** Canonical domain to surface in the wallet UI, e.g. `https://myapp.com`. */
    id: string;

    /** Bare registrable domain (or hostname when PSL lookup was inconclusive). */
    domain: string;

    /** How we arrived at `domain`. */
    verificationMethod: ReconciliationMethod;

    /** Raw origin the JSON was fetched from (always present). */
    fetchOrigin: string;

    /**
     * Raw origin the SDK reported it was rendered on. Present only when it was
     * parseable AND shared an eTLD+1 with the fetch origin (i.e. when it was
     * actually trusted).
     */
    presentingOrigin?: string;
}

/**
 * Treat inputs that `new URL()` accepts as a URL string, but also accept bare
 * hostnames (e.g. `myapp.com`). Returns a parsed URL or `null`.
 */
function tryParseUrlOrHost(raw: string | undefined): URL | null {
    if (!raw || typeof raw !== 'string') return null;

    const trimmed = raw.trim();
    if (!trimmed) return null;

    // If it already has a scheme, parse as-is.
    if (/^https?:\/\//i.test(trimmed)) {
        try {
            return new URL(trimmed);
        } catch {
            return null;
        }
    }

    // Otherwise treat as a bare hostname and tack on https:// so `new URL`
    // accepts it. We do NOT accept non-https presenting origins: SDKs in
    // production always run over https, and http is susceptible to MITM
    // rewrites of the payload before it reaches the wallet.
    try {
        return new URL(`https://${trimmed}`);
    } catch {
        return null;
    }
}

/**
 * Extract the registrable domain (eTLD+1) for a hostname using the Public
 * Suffix List. Falls back to the hostname itself when PSL lookup doesn't
 * apply (e.g. `localhost`, raw IPs, or single-label hostnames).
 */
function registrableDomain(host: string): string {
    return getDomain(host) ?? host.toLowerCase();
}

/**
 * Reconcile the observed fetch origin with the client-claimed presenting
 * origin. Returns a `VerifiedAwardedByDomain` suitable for attaching as
 * `credentialSubject.awardedByDomain`.
 */
export function reconcileAwardedByDomain(
    fetchUrl: URL,
    presenting?: string
): VerifiedAwardedByDomain {
    const fetchOrigin = fetchUrl.origin;
    const fetchHost = fetchUrl.hostname.toLowerCase();
    const fetchEtld1 = registrableDomain(fetchHost);

    const presentingUrl = tryParseUrlOrHost(presenting);

    // No usable presenting signal → fetch origin is all we have.
    if (!presentingUrl) {
        return {
            id: fetchOrigin,
            domain: fetchEtld1,
            verificationMethod: 'fetch-only',
            fetchOrigin,
        };
    }

    const presentingOrigin = presentingUrl.origin;
    const presentingHost = presentingUrl.hostname.toLowerCase();
    const presentingEtld1 = registrableDomain(presentingHost);

    // eTLD+1 mismatch → client is claiming an origin it can't prove. Ignore
    // the claim entirely; fetch origin stays authoritative.
    if (presentingEtld1 !== fetchEtld1) {
        return {
            id: fetchOrigin,
            domain: fetchEtld1,
            verificationMethod: 'presenting-rejected',
            fetchOrigin,
        };
    }

    // Same origin exactly — no promotion needed.
    if (presentingOrigin === fetchOrigin) {
        return {
            id: fetchOrigin,
            domain: fetchEtld1,
            verificationMethod: 'exact-match',
            fetchOrigin,
            presentingOrigin,
        };
    }

    // Same eTLD+1, different subdomains → promote to the registrable domain.
    return {
        id: `https://${presentingEtld1}`,
        domain: presentingEtld1,
        verificationMethod: 'etld1-promote',
        fetchOrigin,
        presentingOrigin,
    };
}
