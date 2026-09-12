import {
    CredentialRefreshChallengeValidator,
    CredentialRefreshFailureCode,
    CredentialRefreshResult,
    JWE,
    JWEValidator,
    VC,
    VCValidator,
    VP,
} from '@learncard/types';
import {
    credentialContentsEqual,
    getCredentialEffectiveTime,
    getCredentialIssuerId,
    getCredentialSubjectIds,
    getSupportedRefreshService,
} from '@learncard/helpers';

import { fetchWithPinnedAddress, type PinnedAddress } from './refreshCredential.fetch';
import { RefreshCredentialOptions, VCDependentLearnCard, VCImplicitLearnCard } from './types';
import {
    extractCompactJwt,
    verifyCredentialJwt,
    type VerifiedCredentialJwtResult,
    type VerifyCredentialJwtPolicy,
} from './verifyCredentialJwt';

/**
 * Generic holder-side credential refresh primitive (LC-2117, LC-2135, LC-2136).
 *
 * `refreshCredential` fetches a candidate replacement from a credential's
 * `1EdTechCredentialRefresh` (JSON or `text/plain` compact VC-JWT) or
 * `LearnCardCredentialRefresh2026` service, verifies both the current and candidate
 * proofs, enforces identity stability and non-regressing freshness, and returns a
 * typed result. It performs no storage or index mutation.
 *
 * The held credential is verified and normalized BEFORE any endpoint is selected or
 * contacted: JWT-backed inputs (raw compact token, `jwt-vc-json` envelope or legacy
 * `JwtProof2020` projection) go through `verifyCredentialJwt`, and every
 * identity/freshness decision uses the token-derived metadata rather than a mutable
 * display object. JSON inputs keep the existing DIDKit linked-data-proof behavior.
 *
 * The generic primitive permits same-issuer-signed changes to credentialStatus and
 * refreshService. It does not pin those fields; applications requiring immutable
 * revocation/refresh handles must enforce that policy. Managed brain-service
 * publication enforces both. Any new endpoint is revalidated on the next refresh.
 *
 * Because `refreshService.id` is credential-controlled input, every request is
 * SSRF-hardened: HTTPS-only by default, private/loopback/link-local destinations are
 * rejected (after DNS resolution in Node runtimes), redirects are followed manually
 * and revalidated, timeouts abort the request, response bytes are counted while
 * streaming, and only JSON VC/JWE representations implemented by the decoder are
 * accepted. DID auth is retried exactly once for the recognized `LearnCardDIDAuth`
 * challenge scheme and is never forwarded across origins.
 */

const DID_AUTH_SCHEME = 'learncarddidauth';

const DEFAULT_TIMEOUT_MS = 10_000;
const HEADER_CHALLENGE_TTL_MS = 300_000;
const MAX_TRACKED_CHALLENGES = 1024;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB

/** JSON representations implemented by the response decoder */
const ACCEPTED_MEDIA_TYPES = new Set([
    'application/json',
    'application/ld+json',
    'application/vc+ld+json',
    'application/vc-ld+json',
    'application/jwe+json',
]);

/**
 * Compact VC-JWT bodies are only permitted for the standard 1EdTech protocol and
 * only when advertised as `text/plain`. They are never accepted for a managed
 * LearnCard service and never accepted as a JSON media type.
 */
const COMPACT_MEDIA_TYPE = 'text/plain';

const ACCEPT_HEADER = [...ACCEPTED_MEDIA_TYPES].join(', ');

const acceptHeaderFor = (serviceType: string): string =>
    serviceType === '1EdTechCredentialRefresh'
        ? `${ACCEPT_HEADER}, ${COMPACT_MEDIA_TYPE}`
        : ACCEPT_HEADER;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

const failed = (
    code: CredentialRefreshFailureCode,
    retryable: boolean
): CredentialRefreshResult => ({
    status: 'failed',
    code,
    retryable,
});

const unsafeEndpoint = () => failed('UNSAFE_ENDPOINT', false);
const malformedResponse = () => failed('MALFORMED_RESPONSE', false);
const invalidProof = () => failed('INVALID_PROOF', false);
const unauthorized = () => failed('UNAUTHORIZED', false);
// Deliberately fail closed on verifier warnings until each warning is reviewed.
// JWT-backed credentials report `'JWS'`; JSON-LD credentials report `'proof'`.
const proofVerified = (
    check: { checks: string[]; warnings: string[]; errors: string[] } | null | undefined
): boolean =>
    !!check &&
    check.errors.length === 0 &&
    check.warnings.length === 0 &&
    (check.checks.includes('proof') || check.checks.includes('JWS'));

type ResolvedRefreshOptions = {
    etag?: string;
    timeoutMs: number;
    maxRedirects: number;
    maxResponseBytes: number;
    allowInsecureHttp: boolean;
    allowPrivateAddresses: boolean;
    resolveHost?: (hostname: string) => Promise<string[]>;
};

// --- SSRF guards --------------------------------------------------------------

const parseIPv4Octets = (ip: string): [number, number, number, number] | undefined => {
    const parts = ip.split('.');

    if (
        parts.length !== 4 ||
        parts.some(part => !/^\d{1,3}$/.test(part) || Number(part) < 0 || Number(part) > 255)
    ) {
        return undefined;
    }

    return parts.map(Number) as [number, number, number, number];
};

/** Rejects loopback, private, link-local, multicast, reserved, and cloud-metadata IPv4 ranges */
export const isPrivateOrReservedIPv4 = (ip: string): boolean => {
    const octets = parseIPv4Octets(ip);

    if (!octets) return true; // malformed literals are unsafe

    const [a, b, c] = octets;

    return (
        a === 0 || // "this" network
        a === 10 || // RFC 1918
        a === 127 || // loopback
        (a === 100 && b >= 64 && b <= 127) || // CGNAT
        (a === 169 && b === 254) || // link-local + cloud metadata
        (a === 172 && b >= 16 && b <= 31) || // RFC 1918
        (a === 192 && b === 0) || // IETF protocol assignments + TEST-NET-1
        (a === 192 && b === 168) || // RFC 1918
        (a === 198 && (b === 18 || b === 19)) || // benchmarking
        (a === 198 && b === 51 && c === 100) || // TEST-NET-2
        (a === 203 && b === 0 && c === 113) || // TEST-NET-3
        a >= 224 // multicast + reserved
    );
};

const parseIPv6Hextets = (raw: string): number[] | undefined => {
    const hasOpeningBracket = raw.startsWith('[');
    const hasClosingBracket = raw.endsWith(']');

    if (hasOpeningBracket !== hasClosingBracket) return undefined;

    const ip = (hasOpeningBracket ? raw.slice(1, -1) : raw).toLowerCase();

    if (!ip || ip.includes('%') || (ip.match(/::/g)?.length ?? 0) > 1) return undefined;

    let normalized = ip;
    const dottedTail = normalized.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];

    if (dottedTail) {
        const octets = parseIPv4Octets(dottedTail);

        if (!octets) return undefined;

        normalized = normalized.slice(0, -dottedTail.length);
        normalized += `${((octets[0] << 8) | octets[1]).toString(16)}:${(
            (octets[2] << 8) |
            octets[3]
        ).toString(16)}`;
    }

    const hasCompression = normalized.includes('::');
    const [leftRaw, rightRaw = ''] = normalized.split('::');
    const left = leftRaw ? leftRaw.split(':') : [];
    const right = rightRaw ? rightRaw.split(':') : [];
    const tokens = [...left, ...right];

    if (
        tokens.some(token => !/^[0-9a-f]{1,4}$/.test(token)) ||
        (hasCompression ? tokens.length >= 8 : tokens.length !== 8)
    ) {
        return undefined;
    }

    const omitted = hasCompression ? 8 - tokens.length : 0;

    return [...left, ...Array<number>(omitted).fill(0), ...right].map(token =>
        typeof token === 'number' ? token : Number.parseInt(token, 16)
    );
};

/**
 * Translation/transition ranges can route an apparently public IPv6 literal to an
 * embedded IPv4 destination. Reject the standardized ranges rather than trusting
 * an intermediary gateway not to expose private or link-local IPv4 services.
 */
const isIPv4TranslationOrTransitionPrefix = (hextets: number[]): boolean => {
    const [first, second, third] = hextets;
    const isNat64WellKnown =
        first === 0x0064 && second === 0xff9b && hextets.slice(2, 6).every(part => part === 0); // 64:ff9b::/96
    const isNat64Local = first === 0x0064 && second === 0xff9b && third === 0x0001; // 64:ff9b:1::/48
    const is6to4 = first === 0x2002; // 2002::/16

    return isNat64WellKnown || isNat64Local || is6to4;
};

/** Rejects loopback, private/transition, link-local, multicast, documentation, and mapped-private IPv6 */
export const isPrivateOrReservedIPv6 = (raw: string): boolean => {
    const hextets = parseIPv6Hextets(raw);

    if (!hextets) return true;

    if (isIPv4TranslationOrTransitionPrefix(hextets)) return true;

    const [first = 0, second = 0] = hextets;
    const isEmbeddedIPv4Prefix = hextets.slice(0, 5).every(part => part === 0);

    if (isEmbeddedIPv4Prefix && (hextets[5] === 0 || hextets[5] === 0xffff)) {
        const embedded = `${(hextets[6] ?? 0) >> 8}.${(hextets[6] ?? 0) & 0xff}.${
            (hextets[7] ?? 0) >> 8
        }.${(hextets[7] ?? 0) & 0xff}`;

        if (isPrivateOrReservedIPv4(embedded)) return true;
    }

    if (hextets.every(part => part === 0)) return true;
    if (hextets.slice(0, 7).every(part => part === 0) && hextets[7] === 1) return true;
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (first === 0x2001 && second === 0x0db8) return true; // docs

    return false;
};

const parsePinnedAddress = (raw: string): PinnedAddress | undefined => {
    if (raw.includes(':')) {
        const hextets = parseIPv6Hextets(raw);

        if (!hextets) return undefined;

        return { address: hextets.map(part => part.toString(16)).join(':'), family: 6 };
    }

    const octets = parseIPv4Octets(raw);

    if (!octets) return undefined;

    return { address: octets.join('.'), family: 4 };
};

const isNodeRuntime = typeof process !== 'undefined' && !!process.versions?.node;

/**
 * Resolves a hostname with Node's DNS resolver. The specifier is intentionally
 * computed so browser bundlers leave the Node builtin external.
 */
const resolveHostnameWithNodeDns = async (hostname: string): Promise<string[]> => {
    const specifier = 'node:dns/promises';
    const dns = (await import(/* @vite-ignore */ specifier)) as typeof import('node:dns/promises');
    const answers = await dns.lookup(hostname, { all: true, verbatim: true });

    return answers.map(answer => answer.address);
};

type ValidatedRefreshUrl = { url: URL; pinnedAddress?: PinnedAddress };
type UrlSafety = ValidatedRefreshUrl | { result: CredentialRefreshResult };

/**
 * Validates a refresh endpoint URL before any request is made.
 *
 * Requires HTTPS unless the explicit local-development opt-in allows HTTP, rejects
 * userinfo, and rejects private/loopback/link-local host literals. In Node-capable
 * runtimes the hostname is resolved and every private answer rejects the endpoint;
 * in browsers only unsafe host literals are rejected and the platform plus CORS are
 * relied upon for host resolution.
 */
const validateRefreshUrl = async (
    rawUrl: string,
    options: ResolvedRefreshOptions
): Promise<UrlSafety> => {
    let url: URL;

    try {
        url = new URL(rawUrl);
    } catch {
        return { result: unsafeEndpoint() };
    }

    if (url.username || url.password) return { result: unsafeEndpoint() };

    const isHttps = url.protocol === 'https:';
    const isHttp = url.protocol === 'http:';

    if (!isHttps && !(isHttp && options.allowInsecureHttp)) return { result: unsafeEndpoint() };

    const isIpv6Literal = url.hostname.startsWith('[');
    const hostname = url.hostname.replace(/^\[|\]$/g, '');

    if (!hostname) return { result: unsafeEndpoint() };

    if (isIpv6Literal) {
        if (!options.allowPrivateAddresses && isPrivateOrReservedIPv6(hostname)) {
            return { result: unsafeEndpoint() };
        }
    } else if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
        if (!options.allowPrivateAddresses && isPrivateOrReservedIPv4(hostname)) {
            return { result: unsafeEndpoint() };
        }
    } else if (options.resolveHost) {
        let addresses: string[];

        try {
            addresses = await options.resolveHost(hostname);
        } catch {
            return { result: failed('UNAVAILABLE', true) };
        }

        if (addresses.length === 0) return { result: failed('UNAVAILABLE', true) };

        const parsedAddresses = addresses.map(parsePinnedAddress);
        const pinnedAddress = parsedAddresses[0];
        const hasUnsafeAnswer = parsedAddresses.some(
            address =>
                !address ||
                (address.family === 6
                    ? isPrivateOrReservedIPv6(address.address)
                    : isPrivateOrReservedIPv4(address.address))
        );

        if (!pinnedAddress || (hasUnsafeAnswer && !options.allowPrivateAddresses)) {
            return { result: unsafeEndpoint() };
        }

        return { url, pinnedAddress };
    }

    return { url };
};

// --- Safe fetching --------------------------------------------------------------

type GuardedResponse = {
    response: Response;
    endpoint: ValidatedRefreshUrl;
    signal: AbortSignal;
    finish: () => void;
};
type FetchOutcome = GuardedResponse | { result: CredentialRefreshResult };

const discardGuardedResponse = async (guarded: GuardedResponse): Promise<void> => {
    try {
        await guarded.response.body?.cancel();
    } catch {
        // The response is already terminal; cancellation is best-effort cleanup.
    } finally {
        guarded.finish();
    }
};

/**
 * Performs a guarded GET: manual redirect handling with full revalidation of every
 * redirect target, a redirect cap, a shared timeout across hops, and no forwarding of
 * LearnCard authorization across origins.
 */
const fetchWithGuards = async (
    initialEndpoint: ValidatedRefreshUrl,
    options: ResolvedRefreshOptions,
    authorization?: string,
    accept: string = ACCEPT_HEADER
): Promise<FetchOutcome> => {
    if (typeof globalThis.fetch !== 'function') {
        return { result: failed('UNAVAILABLE', false) };
    }

    let current = initialEndpoint;
    const initialOrigin = initialEndpoint.url.origin;
    let redirectsRemaining = options.maxRedirects;
    let auth = authorization;
    const deadline = Date.now() + options.timeoutMs;

    for (;;) {
        const remainingMs = deadline - Date.now();
        if (remainingMs <= 0) return { result: failed('TIMEOUT', true) };
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), remainingMs);

        let response: Response;

        try {
            const headers: Record<string, string> = { accept };

            if (options.etag) headers['if-none-match'] = options.etag;
            if (auth) headers.authorization = auth;

            response = await fetchWithPinnedAddress(
                current.url,
                {
                    method: 'GET',
                    redirect: 'manual',
                    signal: controller.signal,
                    headers,
                },
                current.pinnedAddress
            );
        } catch (error) {
            clearTimeout(timer);

            const timedOut =
                controller.signal.aborted || (error as Error | null)?.name === 'AbortError';

            return { result: failed(timedOut ? 'TIMEOUT' : 'UNAVAILABLE', true) };
        }

        if (!REDIRECT_STATUSES.has(response.status)) {
            return {
                response,
                endpoint: current,
                signal: controller.signal,
                finish: () => clearTimeout(timer),
            };
        }

        clearTimeout(timer);
        await response.body?.cancel().catch(() => undefined);

        if (redirectsRemaining <= 0) return { result: failed('UNAVAILABLE', false) };

        const location = response.headers.get('location');

        if (!location) return { result: malformedResponse() };

        let next: URL;

        try {
            next = new URL(location, current.url);
        } catch {
            return { result: unsafeEndpoint() };
        }

        const validated = await validateRefreshUrl(next.href, options);

        if ('result' in validated) return validated;

        if (validated.url.origin !== initialOrigin) auth = undefined;

        redirectsRemaining -= 1;
        current = validated;
    }
};

/**
 * Reads a response body while counting streamed bytes and keeps the request's abort
 * signal observable until streaming completes.
 */
type BodyReadOutcome =
    { body: string } | { result: CredentialRefreshResult; reason: 'timeout' | 'malformed' };

const readBodyWithLimit = async (
    response: Response,
    maxBytes: number,
    signal: AbortSignal
): Promise<BodyReadOutcome> => {
    const declared = Number(response.headers.get('content-length'));

    if (Number.isFinite(declared) && declared > maxBytes) {
        return { result: malformedResponse(), reason: 'malformed' };
    }

    if (!response.body) {
        try {
            const body = await response.text();

            return new TextEncoder().encode(body).byteLength > maxBytes
                ? { result: malformedResponse(), reason: 'malformed' }
                : { body };
        } catch {
            return signal.aborted
                ? { result: failed('TIMEOUT', true), reason: 'timeout' }
                : { result: malformedResponse(), reason: 'malformed' };
        }
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;

    try {
        for (;;) {
            const { done, value } = await reader.read();

            if (done) break;

            total += value?.byteLength ?? 0;

            if (total > maxBytes) {
                await reader.cancel().catch(() => undefined);

                return { result: malformedResponse(), reason: 'malformed' };
            }

            if (value) chunks.push(value);
        }
    } catch {
        return signal.aborted
            ? { result: failed('TIMEOUT', true), reason: 'timeout' }
            : { result: malformedResponse(), reason: 'malformed' };
    }

    const merged = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return { body: new TextDecoder().decode(merged) };
};

type ParsedContentType = {
    mediaType?: string;
    charset?: string;
    /** False only when a charset parameter is present but not a supported text encoding. */
    charsetSupported: boolean;
};

/**
 * Parses a Content-Type header deliberately: the media type is lower-cased and
 * parameter values are unquoted. Only JSON media types and `text/plain` are ever
 * accepted, and a `charset` parameter must name a supported encoding.
 */
const parseContentType = (header: string | null): ParsedContentType => {
    if (!header) return { charsetSupported: true };

    const [rawType, ...rawParams] = header.split(';');
    const mediaType = rawType?.trim().toLowerCase() ?? '';

    let charset: string | undefined;

    for (const param of rawParams) {
        const separator = param.indexOf('=');

        if (separator < 0) continue;

        const name = param.slice(0, separator).trim().toLowerCase();

        if (name !== 'charset') continue;

        charset = param
            .slice(separator + 1)
            .trim()
            .replace(/^"|"$/g, '')
            .toLowerCase();
    }

    const charsetSupported =
        charset === undefined ||
        charset === 'utf-8' ||
        charset === 'utf8' ||
        charset === 'us-ascii' ||
        charset === 'ascii';

    return { mediaType: mediaType || undefined, charset, charsetSupported };
};

// --- Verified normalization ------------------------------------------------------

/**
 * Typed comparison view derived from a *verified* credential.
 *
 * For JWT-backed inputs every field comes from `verifyCredentialJwt`'s
 * token-derived metadata, so mutable display metadata can never influence
 * identity, stability or freshness decisions. For JSON inputs the verified
 * credential itself is authoritative.
 */
type VerifiedView = {
    /** Normalized credential; for JWT inputs it retains the exact compact token under proof.jwt. */
    credential: VC;
    issuer: string | undefined;
    subjectIds: string[];
    id: string | undefined;
    /** Rollback timestamp: normalized issuance time. */
    effectiveTime: number | undefined;
    expiresAt: number | undefined;
    notBefore: number | undefined;
    jwtBacked: boolean;
};

const parseTimestamp = (value: unknown): number | undefined => {
    if (typeof value !== 'string' || value.length === 0) return undefined;

    const parsed = Date.parse(value);

    return Number.isNaN(parsed) ? undefined : parsed;
};

const sortedSubjectIds = (credential: VC): string[] =>
    [...getCredentialSubjectIds(credential)].sort();

const viewFromVerifiedJwt = (
    verified: Extract<VerifiedCredentialJwtResult, { verified: true }>
): VerifiedView => ({
    credential: verified.credential,
    issuer: verified.metadata.issuer,
    subjectIds: [...verified.metadata.subjectIds].sort(),
    id: verified.metadata.id,
    effectiveTime: parseTimestamp(verified.metadata.issuedAt),
    expiresAt: parseTimestamp(verified.metadata.expiresAt),
    notBefore: parseTimestamp(verified.metadata.notBefore),
    jwtBacked: true,
});

const viewFromJson = (credential: VC): VerifiedView => {
    const rawExpiration =
        (credential as { expirationDate?: unknown; validUntil?: unknown }).expirationDate ??
        (credential as { validUntil?: unknown }).validUntil;

    return {
        credential,
        issuer: getCredentialIssuerId(credential),
        subjectIds: sortedSubjectIds(credential),
        id:
            typeof credential.id === 'string' && credential.id.length > 0
                ? credential.id
                : undefined,
        effectiveTime: getCredentialEffectiveTime(credential),
        expiresAt: parseTimestamp(rawExpiration),
        notBefore: parseTimestamp((credential as { validFrom?: unknown }).validFrom),
        jwtBacked: false,
    };
};

type TemporalStatus = 'valid' | 'expired' | 'not-yet-valid';

/**
 * Narrowly scoped temporal evaluation of a verified credential.
 *
 * `expiresAt` and `notBefore` are only ever read from verified/authoritative
 * fields. Expired *held* credentials are handled separately by the caller: a
 * valid signature, issuer authorization and claim binding are still required
 * before any network access, and an invalid held signature never reaches here.
 */
const temporalStatusOf = (view: VerifiedView, at: number = Date.now()): TemporalStatus => {
    if (view.expiresAt !== undefined && at >= view.expiresAt) return 'expired';
    if (view.notBefore !== undefined && at < view.notBefore) return 'not-yet-valid';

    return 'valid';
};

const arraysEqual = (first: string[], second: string[]): boolean =>
    first.length === second.length && first.every((value, index) => value === second[index]);

// --- Managed DID-auth challenge -------------------------------------------------

type ParsedChallenge = { challenge: string; domain?: string; expiresAt: number };

const parseAuthParams = (header: string): Record<string, string> => {
    const params: Record<string, string> = {};
    const pattern = /([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*"([^"]*)"/g;

    let match: RegExpExecArray | null;

    while ((match = pattern.exec(header))) {
        const key = match[1]?.toLowerCase();

        if (key && match[2]) params[key] = match[2];
    }

    return params;
};

/**
 * Parses a `LearnCardDIDAuth` challenge from a 401 response. Challenge/domain
 * parameters are read from the `WWW-Authenticate` header and/or the machine-readable
 * JSON body; when both carry a challenge they must agree. Expired challenges are
 * rejected. Returns `undefined` when the challenge is absent or malformed.
 */
const parseDidAuthChallenge = (
    response: Response,
    bodyText: string,
    expectedDomain: string
): ParsedChallenge | undefined => {
    const header = response.headers.get('www-authenticate') ?? '';

    const scheme = header.trim().split(/\s/, 1)[0]?.toLowerCase();

    if (scheme !== DID_AUTH_SCHEME) return undefined;

    const headerParams = parseAuthParams(header);

    let challenge = headerParams.challenge;
    let domain = headerParams.domain;
    let expiresAt = Date.now() + HEADER_CHALLENGE_TTL_MS;

    if (bodyText) {
        let body: unknown;

        try {
            body = JSON.parse(bodyText);
        } catch {
            return undefined; // machine-readable challenge body must be JSON
        }

        const parsed = CredentialRefreshChallengeValidator.safeParse(body);

        if (!parsed.success) return undefined;

        if (challenge && parsed.data.challenge !== challenge) return undefined; // ambiguous
        if (domain && parsed.data.domain && parsed.data.domain !== domain) return undefined;

        challenge = parsed.data.challenge;
        domain = parsed.data.domain ?? domain;

        expiresAt = Date.parse(parsed.data.expiresAt);

        if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) return undefined;
    }

    if (!challenge || (domain && domain !== expectedDomain)) return undefined;

    return { challenge, domain: expectedDomain, expiresAt };
};

// --- Response decoding ------------------------------------------------------------

type DecodedCandidate = { credential: VC; etag?: string; managedVersion?: number };

const asManagedVersion = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;

type InvokeBag = Record<string, ((...args: unknown[]) => Promise<unknown>) | undefined>;

/**
 * Decodes a refresh response body into a candidate credential. Accepts a bare signed
 * VC, a `{format:'vc'}` envelope, or a `{format:'jwe'}` envelope / bare JWE. Managed
 * JWE payloads are decrypted only when the optional `decryptDagJwe` capability is
 * present on the wallet.
 */
const decodeCandidate = async (
    learnCard: VCImplicitLearnCard,
    json: unknown,
    response: Response
): Promise<DecodedCandidate | CredentialRefreshResult> => {
    const headerEtag = response.headers.get('etag') ?? undefined;

    // Tagged union: VCDM 2.0 credentials may legitimately carry a `status` field, so a
    // bare `VC | CredentialRefreshResult` union cannot be discriminated by `'status' in`.
    const decryptJwe = async (
        jwe: JWE
    ): Promise<{ credential: VC } | { failure: CredentialRefreshResult }> => {
        const decrypt = (learnCard.invoke as unknown as InvokeBag).decryptDagJwe;

        if (typeof decrypt !== 'function') return { failure: failed('UNSUPPORTED_SERVICE', false) };

        let decrypted: unknown;

        try {
            decrypted = await decrypt(jwe);
        } catch {
            return { failure: malformedResponse() };
        }

        const parsed = VCValidator.safeParse(decrypted);

        if (!parsed.success) return { failure: malformedResponse() };

        return { credential: parsed.data as VC };
    };

    const envelopeEtag = (value: unknown) => (typeof value === 'string' ? value : headerEtag);

    if (json !== null && typeof json === 'object' && 'format' in json) {
        const envelope = json as Record<string, unknown>;

        if (envelope.format === 'jwe') {
            const jwe = JWEValidator.safeParse(envelope.jwe);

            if (!jwe.success) return malformedResponse();

            const decrypted = await decryptJwe(jwe.data);

            if ('failure' in decrypted) return decrypted.failure;

            return {
                credential: decrypted.credential,
                etag: envelopeEtag(envelope.etag),
                managedVersion: asManagedVersion(envelope.version),
            };
        }

        if (envelope.format === 'vc') {
            const parsed = VCValidator.safeParse(envelope.credential);

            if (!parsed.success) return malformedResponse();

            return {
                credential: parsed.data as VC,
                etag: envelopeEtag(envelope.etag),
                managedVersion: asManagedVersion(envelope.version),
            };
        }

        return malformedResponse();
    }

    const bareVc = VCValidator.safeParse(json);

    if (bareVc.success) return { credential: bareVc.data as VC, etag: headerEtag };

    const bareJwe = JWEValidator.safeParse(json);

    if (bareJwe.success) {
        const decrypted = await decryptJwe(bareJwe.data);

        if ('failure' in decrypted) return decrypted.failure;

        return { credential: decrypted.credential, etag: headerEtag };
    }

    return malformedResponse();
};

// --- Stability and freshness --------------------------------------------------------

/**
 * Holder-side refresh primitive. See the module docblock for the safety contract.
 *
 * Never includes the current credential or its claims in request headers or logs.
 */
export const refreshCredential = (_initLearnCard: VCDependentLearnCard) => {
    /**
     * Challenges already consumed by this wallet instance. A managed endpoint issues
     * single-use challenges; a repeated challenge value indicates a replay and is
     * rejected without signing.
     */
    // Retain live entries until expiry; fail closed at capacity instead of evicting
    // replay protection. Header-only challenges have a five-minute retention window.
    const usedChallenges = new Map<string, number>();

    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC | string,
        options: RefreshCredentialOptions = {}
    ): Promise<CredentialRefreshResult> => {
        const resolved: ResolvedRefreshOptions = {
            etag: options.etag,
            timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
            maxResponseBytes: options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
            allowInsecureHttp: options.allowInsecureHttp ?? false,
            allowPrivateAddresses: options.allowPrivateAddresses ?? false,
            resolveHost:
                options.resolveHost ?? (isNodeRuntime ? resolveHostnameWithNodeDns : undefined),
        };

        /**
         * Verify an input (held credential or candidate) and derive the
         * authoritative comparison view. JWT-backed inputs go through the typed
         * verified-normalization path, which binds the result to the exact token
         * bytes; JSON inputs keep the existing DIDKit linked-data-proof behavior.
         */
        const verifyToView = async (
            input: VC | string,
            policy: VerifyCredentialJwtPolicy = 'strict'
        ): Promise<
            { ok: true; view: VerifiedView } | { ok: false; result: CredentialRefreshResult }
        > => {
            if (extractCompactJwt(input)) {
                let verified: VerifiedCredentialJwtResult;

                try {
                    verified = await verifyCredentialJwt(_initLearnCard, input, { policy });
                } catch {
                    return { ok: false, result: invalidProof() };
                }

                if (!verified.verified) return { ok: false, result: invalidProof() };

                return { ok: true, view: viewFromVerifiedJwt(verified) };
            }

            try {
                const check = await _learnCard.invoke.verifyCredential(input as VC);

                if (!proofVerified(check)) return { ok: false, result: invalidProof() };
            } catch {
                return { ok: false, result: invalidProof() };
            }

            return { ok: true, view: viewFromJson(input as VC) };
        };

        // The held credential is verified in renewal-only mode: signature, issuer
        // key authorization, `nbf`, proof purpose, nonce and audience are all
        // still enforced, but an already-expired `exp` is tolerated so a held
        // token can discover and fetch its replacement. The candidate is always
        // verified strictly below.
        const heldVerification = await verifyToView(credential, 'allow-expired-for-renewal');

        if (!heldVerification.ok) return heldVerification.result;

        const held = heldVerification.view;

        // A not-yet-valid held credential may never initiate a refresh. An expired
        // held credential (JSON-LD or compact JWT) may renew because its
        // signature was verified above with the renewal-only policy.
        if (temporalStatusOf(held) === 'not-yet-valid') return invalidProof();

        const service = getSupportedRefreshService(held.credential);

        if (!service) return { status: 'unsupported' };

        // Managed publication requires a stable, non-empty ID. Standard credentials
        // may omit it. The ID comes from the verified view, never display metadata.
        if (service.type === 'LearnCardCredentialRefresh2026' && !held.id) {
            return failed('ID_MISMATCH', false);
        }

        const validated = await validateRefreshUrl(service.id, resolved);

        if ('result' in validated) return validated.result;

        const accept = acceptHeaderFor(service.type);

        const initial = await fetchWithGuards(validated, resolved, undefined, accept);

        if ('result' in initial) return initial.result;

        let guardedResponse = initial;
        let response = guardedResponse.response;

        // Managed endpoints authenticate with a single DID-auth retry.
        if (response.status === 401 && service.type === 'LearnCardCredentialRefresh2026') {
            // Only the origin signed into the credential may request a holder proof.
            if (guardedResponse.endpoint.url.origin !== validated.url.origin) {
                await discardGuardedResponse(guardedResponse);
                return unauthorized();
            }
            const challengeRead = await readBodyWithLimit(
                response,
                resolved.maxResponseBytes,
                guardedResponse.signal
            );

            guardedResponse.finish();

            if ('result' in challengeRead) {
                return challengeRead.reason === 'timeout' ? challengeRead.result : unauthorized();
            }

            const expectedDomain = guardedResponse.endpoint.url.host;
            const challenge = parseDidAuthChallenge(response, challengeRead.body, expectedDomain);

            if (!challenge) return unauthorized();

            const challengeKey = `${guardedResponse.endpoint.url.origin}|${challenge.challenge}`;

            const now = Date.now();
            for (const [key, expiresAt] of usedChallenges) {
                if (expiresAt <= now) usedChallenges.delete(key);
            }
            if (usedChallenges.has(challengeKey)) return unauthorized();
            if (usedChallenges.size >= MAX_TRACKED_CHALLENGES) return unauthorized();
            usedChallenges.set(challengeKey, challenge.expiresAt);

            let vp: VP | string;

            try {
                vp = await _learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: challenge.challenge,
                    domain: expectedDomain,
                });
            } catch {
                return unauthorized();
            }

            const retry = await fetchWithGuards(
                guardedResponse.endpoint,
                resolved,
                `Bearer ${typeof vp === 'string' ? vp : JSON.stringify(vp)}`,
                accept
            );

            if ('result' in retry) return retry.result;

            guardedResponse = retry;
            response = guardedResponse.response;
        }

        if (response.status === 304) {
            await discardGuardedResponse(guardedResponse);

            return {
                status: 'unchanged',
                checkedAt: new Date().toISOString(),
                etag: response.headers.get('etag') ?? resolved.etag,
            };
        }

        if (response.status === 410) {
            await discardGuardedResponse(guardedResponse);
            return failed('REVOKED', false);
        }

        if (response.status === 401 || response.status === 403) {
            await discardGuardedResponse(guardedResponse);
            return unauthorized();
        }

        if (response.status < 200 || response.status > 299) {
            await discardGuardedResponse(guardedResponse);
            return failed('UNAVAILABLE', response.status >= 500);
        }

        const contentType = parseContentType(response.headers.get('content-type'));
        const isStandardService = service.type === '1EdTechCredentialRefresh';
        const isCompactStandard = isStandardService && contentType.mediaType === COMPACT_MEDIA_TYPE;
        const isJsonResponse =
            contentType.mediaType !== undefined && ACCEPTED_MEDIA_TYPES.has(contentType.mediaType);

        if ((!isCompactStandard && !isJsonResponse) || !contentType.charsetSupported) {
            await discardGuardedResponse(guardedResponse);
            return malformedResponse();
        }

        const bodyRead = await readBodyWithLimit(
            response,
            resolved.maxResponseBytes,
            guardedResponse.signal
        );

        guardedResponse.finish();

        if ('result' in bodyRead) return bodyRead.result;

        let candidateInput: VC | string;
        let candidateEtag: string | undefined = response.headers.get('etag') ?? undefined;
        let candidateManagedVersion: number | undefined;

        if (isCompactStandard) {
            const compact = extractCompactJwt(bodyRead.body.trim());

            if (!compact) return malformedResponse();

            candidateInput = compact;
        } else {
            let json: unknown;

            try {
                json = JSON.parse(bodyRead.body);
            } catch {
                return malformedResponse();
            }

            // The standard protocol returns a bare credential, never a LearnCard envelope.
            if (isStandardService && !VCValidator.safeParse(json).success) {
                return malformedResponse();
            }

            const decoded = await decodeCandidate(_learnCard, json, response);

            if ('status' in decoded) return decoded;

            candidateInput = decoded.credential;
            candidateEtag = decoded.etag;
            candidateManagedVersion = decoded.managedVersion;
        }

        // Verify the replacement (and re-derive its authoritative claims) before any
        // stability/freshness checks.
        const candidateVerification = await verifyToView(candidateInput);

        if (!candidateVerification.ok) return candidateVerification.result;

        const candidate = candidateVerification.view;

        // Replacements retain full temporal validity: expired or future replacements fail.
        if (temporalStatusOf(candidate) !== 'valid') return invalidProof();

        // Identity stability: same credential ID, normalized issuer, and holder. Holder
        // changes are surfaced as ID_MISMATCH because the holder identity is part of the
        // credential's identity for refresh purposes. Every value is the verified view,
        // so display metadata cannot substitute for token-derived claims.
        if (candidate.id !== held.id) {
            return failed('ID_MISMATCH', false);
        }

        if (candidate.issuer !== held.issuer) {
            return failed('ISSUER_MISMATCH', false);
        }

        if (!arraysEqual(candidate.subjectIds, held.subjectIds)) {
            return failed('ID_MISMATCH', false);
        }

        // Freshness: reject a strictly older effective timestamp.
        if (
            held.effectiveTime !== undefined &&
            candidate.effectiveTime !== undefined &&
            candidate.effectiveTime < held.effectiveTime
        ) {
            return failed('ROLLBACK', false);
        }

        // Proof-insensitive canonical comparison distinguishes updated from unchanged.
        if (credentialContentsEqual(held.credential, candidate.credential)) {
            return {
                status: 'unchanged',
                checkedAt: new Date().toISOString(),
                etag: candidateEtag,
            };
        }

        return {
            status: 'updated',
            credential: candidate.credential,
            ...(candidateEtag ? { etag: candidateEtag } : {}),
            ...(candidateManagedVersion ? { managedVersion: candidateManagedVersion } : {}),
        };
    };
};
