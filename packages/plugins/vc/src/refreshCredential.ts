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
    getSupportedRefreshService,
} from '@learncard/helpers';

import { RefreshCredentialOptions, VCDependentLearnCard, VCImplicitLearnCard } from './types';

/**
 * Generic holder-side credential refresh primitive (LC-2117, LC-2135, LC-2136).
 *
 * `refreshCredential` fetches a candidate replacement from a credential's
 * `1EdTechCredentialRefresh` service, verifies both the current and candidate
 * proofs, enforces identity stability and non-regressing freshness, and returns a
 * typed result. It performs no storage or index mutation.
 *
 * Because `refreshService.id` is credential-controlled input, every request is
 * SSRF-hardened: HTTPS-only by default, private/loopback/link-local destinations are
 * rejected (after DNS resolution in Node runtimes), redirects are followed manually
 * and revalidated, timeouts abort the request, response bytes are counted while
 * streaming, and only documented VC/JWT/JWE JSON media types are accepted. DID auth
 * is retried exactly once for the recognized `LearnCardDIDAuth` challenge scheme and
 * is never forwarded across origins.
 */

const DID_AUTH_SCHEME = 'learncarddidauth';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_MAX_RESPONSE_BYTES = 1_048_576; // 1 MiB

/** Documented VC/JWT/JWE JSON media types accepted from refresh endpoints */
const ACCEPTED_MEDIA_TYPES = new Set([
    'application/json',
    'application/ld+json',
    'application/vc+ld+json',
    'application/vc-ld+json',
    'application/jwt',
    'application/vc+jwt',
    'application/jwe+json',
]);

const ACCEPT_HEADER = [...ACCEPTED_MEDIA_TYPES].join(', ');

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

type ResolvedRefreshOptions = {
    etag?: string;
    timeoutMs: number;
    maxRedirects: number;
    maxResponseBytes: number;
    allowInsecureHttp: boolean;
    resolveHost?: (hostname: string) => Promise<string[]>;
};

// --- SSRF guards --------------------------------------------------------------

/** Rejects loopback, private, link-local, multicast, reserved, and cloud-metadata IPv4 ranges */
export const isPrivateOrReservedIPv4 = (ip: string): boolean => {
    const parts = ip.split('.').map(part => Number(part));

    if (
        parts.length !== 4 ||
        parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)
    ) {
        return true; // malformed literals are unsafe
    }

    const [a, b, c] = parts as [number, number, number, number];

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

/** Rejects loopback, unique-local, link-local, multicast, documentation, and mapped-private IPv6 */
export const isPrivateOrReservedIPv6 = (raw: string): boolean => {
    const ip = raw.toLowerCase();

    const mapped = ip.match(/::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
    if (mapped?.[1]) return isPrivateOrReservedIPv4(mapped[1]);

    if (ip === '::' || ip === '::1') return true;

    const hextets = ip.split(':');
    const first = Number.parseInt(hextets[0] || '0', 16);

    if (Number.isNaN(first)) return true;
    if ((first & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true; // ff00::/8 multicast
    if (first === 0x2001 && Number.parseInt(hextets[1] || '0', 16) === 0x0db8) return true; // docs

    return false;
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

type UrlSafety = { url: URL } | { result: CredentialRefreshResult };

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
        if (isPrivateOrReservedIPv6(hostname)) return { result: unsafeEndpoint() };
    } else if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
        if (isPrivateOrReservedIPv4(hostname)) return { result: unsafeEndpoint() };
    } else if (options.resolveHost) {
        let addresses: string[];

        try {
            addresses = await options.resolveHost(hostname);
        } catch {
            return { result: failed('UNAVAILABLE', true) };
        }

        const hasUnsafeAnswer = addresses.some(address =>
            address.includes(':')
                ? isPrivateOrReservedIPv6(address)
                : isPrivateOrReservedIPv4(address)
        );

        if (hasUnsafeAnswer) return { result: unsafeEndpoint() };
    }

    return { url };
};

// --- Safe fetching --------------------------------------------------------------

type FetchOutcome = { response: Response } | { result: CredentialRefreshResult };

/**
 * Performs a guarded GET: manual redirect handling with full revalidation of every
 * redirect target, a redirect cap, an abort timeout per attempt, and no forwarding of
 * LearnCard authorization across origins.
 */
const fetchWithGuards = async (
    initialUrl: URL,
    options: ResolvedRefreshOptions,
    authorization?: string
): Promise<FetchOutcome> => {
    if (typeof globalThis.fetch !== 'function') {
        return { result: failed('UNAVAILABLE', false) };
    }

    let current = initialUrl;
    const initialOrigin = initialUrl.origin;
    let redirectsRemaining = options.maxRedirects;
    let auth = authorization;

    for (;;) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), options.timeoutMs);

        let response: Response;

        try {
            const headers: Record<string, string> = { accept: ACCEPT_HEADER };

            if (options.etag) headers['if-none-match'] = options.etag;
            if (auth) headers.authorization = auth;

            response = await globalThis.fetch(current.href, {
                method: 'GET',
                redirect: 'manual',
                signal: controller.signal,
                headers,
            });
        } catch (error) {
            clearTimeout(timer);

            const timedOut =
                controller.signal.aborted || (error as Error | null)?.name === 'AbortError';

            return { result: failed(timedOut ? 'TIMEOUT' : 'UNAVAILABLE', true) };
        }

        clearTimeout(timer);

        if (!REDIRECT_STATUSES.has(response.status)) return { response };

        if (redirectsRemaining <= 0) return { result: failed('UNAVAILABLE', false) };

        const location = response.headers.get('location');

        if (!location) return { result: malformedResponse() };

        let next: URL;

        try {
            next = new URL(location, current);
        } catch {
            return { result: unsafeEndpoint() };
        }

        const validated = await validateRefreshUrl(next.href, options);

        if ('result' in validated) return validated;

        if (next.origin !== initialOrigin) auth = undefined;

        redirectsRemaining -= 1;
        current = next;
    }
};

/**
 * Reads a response body while counting streamed bytes, returning `undefined` when the
 * declared or actual size exceeds the configured cap.
 */
const readBodyWithLimit = async (
    response: Response,
    maxBytes: number
): Promise<string | undefined> => {
    const declared = Number(response.headers.get('content-length'));

    if (Number.isFinite(declared) && declared > maxBytes) return undefined;

    if (!response.body) {
        const text = await response.text();

        return new TextEncoder().encode(text).byteLength > maxBytes ? undefined : text;
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

                return undefined;
            }

            if (value) chunks.push(value);
        }
    } catch {
        return undefined;
    }

    const merged = new Uint8Array(total);
    let offset = 0;

    for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
    }

    return new TextDecoder().decode(merged);
};

const isAcceptedMediaType = (contentType: string | null): boolean => {
    if (!contentType) return false;

    const mediaType = contentType.split(';', 1)[0]?.trim().toLowerCase() ?? '';

    return ACCEPTED_MEDIA_TYPES.has(mediaType);
};

// --- Managed DID-auth challenge -------------------------------------------------

type ParsedChallenge = { challenge: string; domain?: string };

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
    bodyText: string
): ParsedChallenge | undefined => {
    const header = response.headers.get('www-authenticate') ?? '';

    if (!header.toLowerCase().startsWith(DID_AUTH_SCHEME)) return undefined;

    const headerParams = parseAuthParams(header);

    let challenge = headerParams.challenge;
    let domain = headerParams.domain;

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

        challenge = parsed.data.challenge;
        domain = parsed.data.domain ?? domain;

        const expiresAt = Date.parse(parsed.data.expiresAt);

        if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) return undefined;
    }

    if (!challenge) return undefined;

    return { challenge, domain };
};

// --- Response decoding ------------------------------------------------------------

type DecodedCandidate = { credential: VC; etag?: string; managedVersion?: number };

const asManagedVersion = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined;

type InvokeBag = Record<string, ((...args: any[]) => Promise<any>) | undefined>;

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
        const envelope = json as Record<string, any>;

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

const getHolderIds = (vc: VC): string[] => {
    const subject = vc.credentialSubject as { id?: unknown } | Array<{ id?: unknown }>;
    const subjects = Array.isArray(subject) ? subject : [subject];

    return subjects.map(entry => (typeof entry?.id === 'string' ? entry.id : '')).sort();
};

const holdersEqual = (first: VC, second: VC): boolean => {
    const firstIds = getHolderIds(first);
    const secondIds = getHolderIds(second);

    return (
        firstIds.length === secondIds.length &&
        firstIds.every((id, index) => id === secondIds[index])
    );
};

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
    const usedChallenges = new Set<string>();

    return async (
        _learnCard: VCImplicitLearnCard,
        credential: VC,
        options: RefreshCredentialOptions = {}
    ): Promise<CredentialRefreshResult> => {
        const resolved: ResolvedRefreshOptions = {
            etag: options.etag,
            timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
            maxRedirects: options.maxRedirects ?? DEFAULT_MAX_REDIRECTS,
            maxResponseBytes: options.maxResponseBytes ?? DEFAULT_MAX_RESPONSE_BYTES,
            allowInsecureHttp: options.allowInsecureHttp ?? false,
            resolveHost:
                options.resolveHost ?? (isNodeRuntime ? resolveHostnameWithNodeDns : undefined),
        };

        const service = getSupportedRefreshService(credential);

        if (!service) return { status: 'unsupported' };

        // Verify the currently held credential before contacting the endpoint.
        try {
            const check = await _learnCard.invoke.verifyCredential(credential);

            if (!check || check.errors.length > 0) return invalidProof();
        } catch {
            return invalidProof();
        }

        // Refresh requires a stable nonempty credential ID.
        if (typeof credential.id !== 'string' || credential.id.length === 0) {
            return failed('ID_MISMATCH', false);
        }

        const validated = await validateRefreshUrl(service.id, resolved);

        if ('result' in validated) return validated.result;

        const initial = await fetchWithGuards(validated.url, resolved);

        if ('result' in initial) return initial.result;

        let response = initial.response;

        // Managed endpoints authenticate with a single DID-auth retry.
        if (response.status === 401) {
            const challengeBody =
                (await readBodyWithLimit(response, resolved.maxResponseBytes)) ?? '';
            const challenge = parseDidAuthChallenge(response, challengeBody);

            if (!challenge) return unauthorized();

            const challengeKey = `${service.id}|${challenge.challenge}`;

            if (usedChallenges.has(challengeKey)) return unauthorized();

            usedChallenges.add(challengeKey);

            let vp: VP | string;

            try {
                vp = await _learnCard.invoke.getDidAuthVp({
                    proofFormat: 'jwt',
                    challenge: challenge.challenge,
                    domain: challenge.domain ?? validated.url.host,
                });
            } catch {
                return unauthorized();
            }

            const retry = await fetchWithGuards(
                validated.url,
                resolved,
                `Bearer ${typeof vp === 'string' ? vp : JSON.stringify(vp)}`
            );

            if ('result' in retry) return retry.result;

            response = retry.response;
        }

        if (response.status === 304) {
            return {
                status: 'unchanged',
                checkedAt: new Date().toISOString(),
                etag: response.headers.get('etag') ?? resolved.etag,
            };
        }

        if (response.status === 410) return failed('REVOKED', false);

        if (response.status === 401 || response.status === 403) return unauthorized();

        if (response.status < 200 || response.status > 299) {
            return failed('UNAVAILABLE', response.status >= 500);
        }

        if (!isAcceptedMediaType(response.headers.get('content-type'))) return malformedResponse();

        const bodyText = await readBodyWithLimit(response, resolved.maxResponseBytes);

        if (bodyText === undefined) return malformedResponse();

        let json: unknown;

        try {
            json = JSON.parse(bodyText);
        } catch {
            return malformedResponse();
        }

        const decoded = await decodeCandidate(_learnCard, json, response);

        if ('status' in decoded) return decoded;

        const candidate = decoded.credential;

        // Verify the replacement proof before any stability/freshness checks.
        try {
            const check = await _learnCard.invoke.verifyCredential(candidate);

            if (!check || check.errors.length > 0) return invalidProof();
        } catch {
            return invalidProof();
        }

        // Identity stability: same credential ID, normalized issuer, and holder. Holder
        // changes are surfaced as ID_MISMATCH because the holder identity is part of the
        // credential's identity for refresh purposes.
        if (typeof candidate.id !== 'string' || candidate.id !== credential.id) {
            return failed('ID_MISMATCH', false);
        }

        if (getCredentialIssuerId(candidate) !== getCredentialIssuerId(credential)) {
            return failed('ISSUER_MISMATCH', false);
        }

        if (!holdersEqual(credential, candidate)) return failed('ID_MISMATCH', false);

        // Freshness: reject a strictly older effective timestamp.
        const currentTime = getCredentialEffectiveTime(credential);
        const candidateTime = getCredentialEffectiveTime(candidate);

        if (
            currentTime !== undefined &&
            candidateTime !== undefined &&
            candidateTime < currentTime
        ) {
            return failed('ROLLBACK', false);
        }

        // Proof-insensitive canonical comparison distinguishes updated from unchanged.
        if (credentialContentsEqual(credential, candidate)) {
            return { status: 'unchanged', checkedAt: new Date().toISOString(), etag: decoded.etag };
        }

        return {
            status: 'updated',
            credential: candidate,
            ...(decoded.etag ? { etag: decoded.etag } : {}),
            ...(decoded.managedVersion ? { managedVersion: decoded.managedVersion } : {}),
        };
    };
};
