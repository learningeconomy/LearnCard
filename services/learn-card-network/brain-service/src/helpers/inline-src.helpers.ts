/**
 * SSRF guard for the `inline-src` VC-API fetch path.
 *
 * Design context
 * --------------
 * The inline-src workflow fetches partner-hosted JSON and (for unsigned VCs)
 * signs it on the partner's behalf. Earlier phases of this feature gated
 * access with a static partner allowlist (`INLINE_SRC_ALLOWED_HOSTS`). That
 * has now been retired in favor of the two-signal domain reconciliation model
 * (see `inline-origin.helpers.ts`): every issued credential carries a
 * server-verified `credentialSubject.awardedByDomain` derived from the https
 * origin that served the JSON, so partners are trust-anchored by domain
 * control rather than by being on an allowlist.
 *
 * Without an allowlist, the server must still refuse to be pointed at
 * internal network resources (loopback, RFC1918, link-local, AWS/GCP metadata
 * endpoints at 169.254.169.254, etc.). That is this module's job.
 *
 * Layered defense:
 *   1. Protocol: https only. (Already enforced upstream; repeated here as
 *      defense in depth.)
 *   2. Hostname: reject reserved names (`localhost`, `*.local`, single-label
 *      hosts, `*.internal`).
 *   3. IP literal: if the hostname IS an IP, reject loopback / private /
 *      link-local / multicast / IPv4-mapped variants.
 *   4. DNS resolution: resolve the hostname and reject if any returned
 *      address falls in a restricted range.
 *
 * Known limitation: DNS rebinding TOCTOU — the resolver may return a safe IP
 * during the guard check and a malicious IP when `fetch()` later resolves.
 * Closing that requires fetching by IP while overriding the `Host` header,
 * which is deferred until there's a concrete threat that warrants it.
 */

import * as dnsPromises from 'node:dns/promises';
import { isIP } from 'node:net';

// ---------------------------------------------------------------------------
// IP range classification
// ---------------------------------------------------------------------------

/** True if an IP literal falls in a range that must never be reachable. */
function isRestrictedIp(ip: string): boolean {
    const family = isIP(ip);
    if (family === 0) return false;

    if (family === 4) {
        const parts = ip.split('.').map(Number);
        const [a, b] = parts as [number, number, number, number];
        if (a === 0) return true; // 0.0.0.0/8 "this network"
        if (a === 10) return true; // RFC1918
        if (a === 127) return true; // loopback
        if (a === 169 && b === 254) return true; // link-local (inc. cloud metadata)
        if (a === 172 && b >= 16 && b <= 31) return true; // RFC1918
        if (a === 192 && b === 168) return true; // RFC1918
        if (a === 192 && b === 0) return true; // 192.0.0.0/24 reserved
        if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
        if (a >= 224) return true; // multicast + reserved (224.0.0.0 +)
        return false;
    }

    // IPv6
    const normalized = ip.toLowerCase();
    if (normalized === '::' || normalized === '::1') return true; // unspecified, loopback
    if (/^fe[89ab][0-9a-f]?:/.test(normalized)) return true; // fe80::/10 link-local
    if (/^f[cd][0-9a-f]{2}:/.test(normalized)) return true; // fc00::/7 unique-local
    if (/^ff[0-9a-f]{2}:/.test(normalized)) return true; // multicast

    // IPv4-mapped IPv6: `::ffff:a.b.c.d` — delegate to IPv4 check.
    const v4Mapped = normalized.match(/^::ffff:([0-9.]+)$/);
    if (v4Mapped && isIP(v4Mapped[1]!) === 4) {
        return isRestrictedIp(v4Mapped[1]!);
    }

    return false;
}

// ---------------------------------------------------------------------------
// Hostname classification
// ---------------------------------------------------------------------------

const RESERVED_HOSTNAMES: ReadonlySet<string> = new Set([
    'localhost',
    'ip6-localhost',
    'ip6-loopback',
    'broadcasthost',
]);

function isRestrictedHostname(host: string): string | null {
    const h = host.toLowerCase();

    if (RESERVED_HOSTNAMES.has(h)) return 'reserved hostname';

    // Non-public TLDs commonly used for internal infra / mDNS.
    if (h.endsWith('.local')) return 'mDNS (.local) hostname';
    if (h.endsWith('.localhost')) return '.localhost TLD';
    if (h.endsWith('.internal')) return '.internal TLD';

    // Single-label hostnames resolve via local search domains and are a
    // classic SSRF vector on internal networks (e.g. `http://router/`).
    // IP literals are single-"label" per dotted-quad but handled by caller.
    if (isIP(h) === 0 && !h.includes('.')) return 'single-label hostname';

    return null;
}

// ---------------------------------------------------------------------------
// Dev-mode bypass
// ---------------------------------------------------------------------------
//
// Local development (partner HTML served over http://localhost) cannot satisfy
// the production SSRF policy: the URL is http, the hostname is `localhost`,
// and the DNS resolves to 127.0.0.1 — all three are hard rejects. Setting
// `INLINE_SRC_DEV_MODE=1` disables the guard so those demos can complete
// end-to-end against a local brain-service.
//
// Hard rule: this env MUST NEVER be set in production. The warning below is
// loud (every request) so it is obvious in logs when accidentally enabled.

export function isInlineSrcDevMode(): boolean {
    const v = process.env.INLINE_SRC_DEV_MODE;
    return v === '1' || v === 'true';
}

let devModeWarningShown = false;
function logDevModeWarning(url: URL): void {
    if (!devModeWarningShown) {
        // eslint-disable-next-line no-console
        console.warn(
            '[inline-src] INLINE_SRC_DEV_MODE=1 is active — SSRF guard is DISABLED. ' +
                'This is for local development ONLY. Never set this env in production.'
        );
        devModeWarningShown = true;
    }
    // eslint-disable-next-line no-console
    console.warn(`[inline-src] dev-mode fetch: ${url.href}`);
}

// ---------------------------------------------------------------------------
// Test-only DNS hook
// ---------------------------------------------------------------------------
//
// Vitest can't reliably stub Node built-in ESM exports. Expose a narrow hook
// so unit tests can swap in a deterministic resolver without reaching into
// implementation internals. Production callers never touch this.

type LookupFn = (host: string) => Promise<Array<{ address: string; family: number }>>;

const defaultLookup: LookupFn = async host =>
    (await dnsPromises.lookup(host, { all: true, verbatim: true })) as Array<{
        address: string;
        family: number;
    }>;

let currentLookup: LookupFn = defaultLookup;

export const __testHooks = {
    setDnsLookup(fn: LookupFn): void {
        currentLookup = fn;
    },
    resetDnsLookup(): void {
        currentLookup = defaultLookup;
    },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export class InlineSrcUrlRejected extends Error {
    constructor(
        message: string,
        public readonly reason:
            | 'protocol'
            | 'reserved-hostname'
            | 'restricted-ip'
            | 'dns-failure'
    ) {
        super(message);
        this.name = 'InlineSrcUrlRejected';
    }
}

/**
 * Throws `InlineSrcUrlRejected` if the URL is unsafe for server-side fetch.
 * Returns void on success. Callers should map the exception to whatever
 * transport-level error code they use (brain-service maps to BAD_REQUEST).
 *
 * When `INLINE_SRC_DEV_MODE=1` is set, ALL guards are bypassed (only a loud
 * console warning is emitted). Never enable this in production.
 */
export async function assertInlineSrcSafe(url: URL): Promise<void> {
    if (isInlineSrcDevMode()) {
        logDevModeWarning(url);
        return;
    }

    if (url.protocol !== 'https:') {
        throw new InlineSrcUrlRejected(
            `inline-src URL must use https (got ${url.protocol})`,
            'protocol'
        );
    }

    const host = url.hostname;

    const hostnameReason = isRestrictedHostname(host);
    if (hostnameReason) {
        throw new InlineSrcUrlRejected(
            `inline-src host is not reachable: ${hostnameReason}`,
            'reserved-hostname'
        );
    }

    // Literal IP in the URL: skip DNS and validate directly.
    if (isIP(host) !== 0) {
        if (isRestrictedIp(host)) {
            throw new InlineSrcUrlRejected(
                `inline-src URL targets a restricted IP range (${host})`,
                'restricted-ip'
            );
        }
        return;
    }

    // DNS resolution path. Any record in a restricted range disqualifies the
    // host — we use `all: true` so a single "safe" answer can't cover for a
    // malicious one in the record set.
    let addresses: Array<{ address: string; family: number }>;
    try {
        addresses = await currentLookup(host);
    } catch (err) {
        throw new InlineSrcUrlRejected(
            `inline-src host did not resolve: ${(err as Error).message}`,
            'dns-failure'
        );
    }

    if (addresses.length === 0) {
        throw new InlineSrcUrlRejected(
            'inline-src host did not resolve to any address',
            'dns-failure'
        );
    }

    for (const { address } of addresses) {
        if (isRestrictedIp(address)) {
            throw new InlineSrcUrlRejected(
                `inline-src host resolves to a restricted IP range (${address})`,
                'restricted-ip'
            );
        }
    }
}

// Internal helpers exported for unit tests.
export const __internalForTests = {
    isRestrictedIp,
    isRestrictedHostname,
};
