/**
 * Slice 7.5 — **signed Authorization Request (Request Object) verification**.
 *
 * OpenID4VP §5 lets the verifier deliver the full Authorization Request
 * as a signed JWS, either embedded inline (`request=<jws>`) or fetched
 * by reference (`request_uri=<https-url>`). Signature verification
 * hinges on the verifier's `client_id_scheme`:
 *
 *   - **`redirect_uri`** — NO signed Request Object is permitted. The
 *     `client_id` is an opaque response URL and there's no signing key
 *     to check. If we receive a JWS for this scheme we reject it.
 *   - **`did`** — `client_id` is a DID URL. The JWS `kid` header MUST
 *     identify a verification method on the DID document, and the JWS
 *     signature MUST verify against that method's public key.
 *   - **`x509_san_dns`** — The JWS `x5c` header carries a DER cert
 *     chain. The leaf cert's SAN dNSName MUST match the host portion
 *     of `client_id`, and the JWS signature MUST verify against the
 *     leaf cert's public key. A caller-supplied `trustedX509Roots`
 *     list pins the trust anchor; in the absence of one we refuse
 *     unless `unsafeAllowSelfSigned` is explicitly set.
 *
 * Unsupported schemes (`pre-registered`, `verifier_attestation`, …)
 * raise a typed error so callers can degrade gracefully.
 *
 * This module is **pure and injectable**: the DID resolver + fetch
 * implementation are passed in. The plugin wires defaults for
 * `did:jwk` (inline) and `did:web` (over the caller's fetch). Callers
 * plug in their own resolver to support `did:key`, `did:ion`, etc.
 */
import { importJWK, importX509, jwtVerify, JWK } from 'jose';

import {
    AuthorizationRequest,
    PresentationDefinition,
} from './types';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export type RequestObjectErrorCode =
    | 'invalid_request_object'
    | 'request_fetch_failed'
    | 'missing_client_id_scheme'
    | 'unsupported_client_id_scheme'
    | 'client_id_mismatch'
    | 'request_signature_invalid'
    | 'request_signer_untrusted'
    | 'did_resolution_failed'
    | 'unsafe_mode_rejected';

export class RequestObjectError extends Error {
    readonly code: RequestObjectErrorCode;

    constructor(
        code: RequestObjectErrorCode,
        message: string,
        options?: { cause?: unknown }
    ) {
        super(message);
        this.name = 'RequestObjectError';
        this.code = code;
        if (options?.cause !== undefined) {
            (this as { cause?: unknown }).cause = options.cause;
        }
    }
}

/**
 * Minimal DID Document shape the resolver surface consumes. We avoid
 * re-modeling the full spec — consumers only need enough to pull a
 * `publicKeyJwk` out.
 */
export interface VerificationMethod {
    id: string;
    type: string;
    controller?: string;
    publicKeyJwk?: JWK;
    publicKeyMultibase?: string;
}

export interface DidDocument {
    id: string;
    verificationMethod?: VerificationMethod[];
    authentication?: Array<string | VerificationMethod>;
    assertionMethod?: Array<string | VerificationMethod>;
}

export type DidResolver = (did: string) => Promise<DidDocument>;

export interface VerifyRequestObjectOptions {
    /** The `request_uri` to fetch. Mutually exclusive with `inlineJwt`. */
    requestUri?: string;

    /** The inline `request=<jws>` parameter value. Mutually exclusive with `requestUri`. */
    inlineJwt?: string;

    /**
     * `client_id` from the outer URL params. Some verifiers let the
     * `client_id` live in the URL while the JWS payload just repeats
     * it; we cross-check them. Optional — only used as a consistency
     * check when provided.
     */
    urlClientId?: string;

    /**
     * `client_id_scheme` from the outer URL params. Same cross-check
     * rationale as `urlClientId`.
     */
    urlClientIdScheme?: string;

    fetchImpl?: typeof fetch;

    /**
     * DID resolver override. When omitted, a built-in resolver handles
     * `did:jwk` (offline) and `did:web` (over `fetchImpl`). Host apps
     * that ship `did:key`/`did:ion`/… wire their own resolver here.
     */
    didResolver?: DidResolver;

    /**
     * Trusted X.509 root certificates (PEM strings). When scheme is
     * `x509_san_dns`, the chain presented in `x5c` MUST root to one of
     * these. If this list is empty and `unsafeAllowSelfSigned` is
     * false, we refuse to verify x509-signed Request Objects.
     */
    trustedX509Roots?: readonly string[];

    /**
     * **Dangerous.** Accept self-signed / untrusted x509 chains for
     * local development. The harness flips this on when a user
     * explicitly opts in; production wallets must leave it off.
     */
    unsafeAllowSelfSigned?: boolean;
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Fetch-and-verify a signed OpenID4VP Authorization Request Object.
 *
 * Returns the canonical {@link AuthorizationRequest} shape built from
 * the verified JWS payload. On any failure — fetch, decode, signature,
 * trust-anchor — throws {@link RequestObjectError} with a stable code.
 */
export const verifyAndDecodeRequestObject = async (
    opts: VerifyRequestObjectOptions
): Promise<AuthorizationRequest> => {
    const jws = await loadJws(opts);

    const { header, claims } = decodeHeaderAndClaims(jws);

    const clientId = asString(claims.client_id);
    if (!clientId) {
        throw new RequestObjectError(
            'invalid_request_object',
            'Request Object JWS payload is missing client_id'
        );
    }

    const scheme = asString(claims.client_id_scheme) ?? opts.urlClientIdScheme;
    if (!scheme) {
        throw new RequestObjectError(
            'missing_client_id_scheme',
            'Request Object has no client_id_scheme (in claims or URL)'
        );
    }

    // Defense-in-depth: the outer URL's client_id (when present) MUST
    // match the signed claim. Otherwise an attacker could wrap someone
    // else's signed request and re-point it.
    if (opts.urlClientId && opts.urlClientId !== clientId) {
        throw new RequestObjectError(
            'client_id_mismatch',
            `Outer URL client_id (${opts.urlClientId}) does not match signed Request Object client_id (${clientId})`
        );
    }

    switch (scheme) {
        case 'redirect_uri':
            throw new RequestObjectError(
                'unsupported_client_id_scheme',
                'client_id_scheme=redirect_uri does not permit signed Request Objects (OID4VP §5)'
            );

        case 'did':
            await verifyWithDid({ jws, header, clientId, opts });
            break;

        case 'x509_san_dns':
            await verifyWithX509({ jws, header, clientId, opts });
            break;

        default:
            throw new RequestObjectError(
                'unsupported_client_id_scheme',
                `client_id_scheme=${scheme} is not supported (supported: did, x509_san_dns)`
            );
    }

    return buildRequestFromClaims(clientId, scheme, claims);
};

/* -------------------------------------------------------------------------- */
/*                                  fetch                                     */
/* -------------------------------------------------------------------------- */

const loadJws = async (opts: VerifyRequestObjectOptions): Promise<string> => {
    if (opts.inlineJwt) {
        if (!looksLikeJws(opts.inlineJwt)) {
            throw new RequestObjectError(
                'invalid_request_object',
                'Inline `request` parameter is not a compact JWS'
            );
        }
        return opts.inlineJwt;
    }

    if (!opts.requestUri) {
        throw new RequestObjectError(
            'invalid_request_object',
            'verifyAndDecodeRequestObject requires either inlineJwt or requestUri'
        );
    }

    const fetchImpl = opts.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new RequestObjectError(
            'request_fetch_failed',
            'No fetch implementation available to resolve request_uri'
        );
    }

    let response: Response;
    try {
        response = await fetchImpl(opts.requestUri, { method: 'GET' });
    } catch (e) {
        throw new RequestObjectError(
            'request_fetch_failed',
            `Failed to fetch request_uri: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!response.ok) {
        throw new RequestObjectError(
            'request_fetch_failed',
            `request_uri returned ${response.status} ${response.statusText}`
        );
    }

    const body = (await response.text()).trim();

    if (!looksLikeJws(body)) {
        throw new RequestObjectError(
            'invalid_request_object',
            'request_uri response is not a compact JWS'
        );
    }

    return body;
};

/* -------------------------------------------------------------------------- */
/*                               decode helpers                               */
/* -------------------------------------------------------------------------- */

interface DecodedJws {
    header: Record<string, unknown>;
    claims: Record<string, unknown>;
}

const decodeHeaderAndClaims = (jws: string): DecodedJws => {
    const [headerB64, payloadB64] = jws.split('.');

    try {
        const header = JSON.parse(b64urlDecode(headerB64!)) as Record<string, unknown>;
        const claims = JSON.parse(b64urlDecode(payloadB64!)) as Record<string, unknown>;
        return { header, claims };
    } catch (e) {
        throw new RequestObjectError(
            'invalid_request_object',
            `Failed to decode Request Object JWS: ${describe(e)}`,
            { cause: e }
        );
    }
};

/* -------------------------------------------------------------------------- */
/*                       client_id_scheme=did verification                    */
/* -------------------------------------------------------------------------- */

interface VerifyCtx {
    jws: string;
    header: Record<string, unknown>;
    clientId: string;
    opts: VerifyRequestObjectOptions;
}

const verifyWithDid = async (ctx: VerifyCtx): Promise<void> => {
    const { jws, header, clientId, opts } = ctx;

    // Per Draft 22 §5.10.2, the JWS `kid` MUST reference a verification
    // method in the client_id DID document. It may be the fully
    // qualified VM id (did:...#frag) or just the fragment.
    const kid = asString(header.kid);
    if (!kid) {
        throw new RequestObjectError(
            'invalid_request_object',
            'Request Object JWS header is missing kid (required for client_id_scheme=did)'
        );
    }

    const did = clientId.split('#')[0]!;

    const resolver = opts.didResolver ?? builtInDidResolver(opts.fetchImpl);

    let doc: DidDocument;
    try {
        doc = await resolver(did);
    } catch (e) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `Failed to resolve ${did}: ${describe(e)}`,
            { cause: e }
        );
    }

    const vm = findVerificationMethod(doc, kid);
    if (!vm) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            `Verification method ${kid} not found on ${did}`
        );
    }

    if (!vm.publicKeyJwk) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            `Verification method ${vm.id} has no publicKeyJwk (publicKeyMultibase not supported by default resolver)`
        );
    }

    const alg = asString(header.alg);
    if (!alg) {
        throw new RequestObjectError(
            'invalid_request_object',
            'Request Object JWS header is missing alg'
        );
    }

    let key: Awaited<ReturnType<typeof importJWK>>;
    try {
        key = await importJWK(vm.publicKeyJwk, alg);
    } catch (e) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            `Failed to import publicKeyJwk from ${vm.id}: ${describe(e)}`,
            { cause: e }
        );
    }

    try {
        await jwtVerify(jws, key);
    } catch (e) {
        throw new RequestObjectError(
            'request_signature_invalid',
            `JWS signature verification failed: ${describe(e)}`,
            { cause: e }
        );
    }
};

const findVerificationMethod = (
    doc: DidDocument,
    kid: string
): VerificationMethod | undefined => {
    const pool: VerificationMethod[] = [];

    for (const vm of doc.verificationMethod ?? []) pool.push(vm);
    for (const ref of doc.authentication ?? [])
        if (typeof ref === 'object') pool.push(ref);
    for (const ref of doc.assertionMethod ?? [])
        if (typeof ref === 'object') pool.push(ref);

    // Match either the fully-qualified VM id or just the fragment.
    const fragment = kid.includes('#') ? kid.split('#').pop()! : kid;

    return pool.find(
        vm => vm.id === kid || vm.id.split('#').pop() === fragment
    );
};

/* -------------------------------------------------------------------------- */
/*                    client_id_scheme=x509_san_dns verification              */
/* -------------------------------------------------------------------------- */

const verifyWithX509 = async (ctx: VerifyCtx): Promise<void> => {
    const { jws, header, clientId, opts } = ctx;

    const x5c = header.x5c;
    if (!Array.isArray(x5c) || x5c.length === 0) {
        throw new RequestObjectError(
            'invalid_request_object',
            'Request Object JWS header is missing x5c (required for client_id_scheme=x509_san_dns)'
        );
    }

    // Defensive DER → X509Certificate construction.
    let chain: import('node:crypto').X509Certificate[];
    try {
        chain = await buildCertChain(x5c as string[]);
    } catch (e) {
        throw new RequestObjectError(
            'invalid_request_object',
            `Failed to parse x5c chain: ${describe(e)}`,
            { cause: e }
        );
    }

    const leaf = chain[0]!;

    // SAN DNS binding: client_id (as URL host) MUST appear in leaf SAN.
    const expectedHost = hostFromClientId(clientId);
    if (!leaf.checkHost(expectedHost)) {
        throw new RequestObjectError(
            'client_id_mismatch',
            `Leaf certificate SAN does not cover client_id host "${expectedHost}" (subjectAltName=${leaf.subjectAltName ?? 'none'})`
        );
    }

    // Trust-anchor check.
    const trusted = opts.trustedX509Roots ?? [];
    const allowSelfSigned = Boolean(opts.unsafeAllowSelfSigned);

    if (trusted.length === 0 && !allowSelfSigned) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            'client_id_scheme=x509_san_dns requires trustedX509Roots (or unsafeAllowSelfSigned for dev)'
        );
    }

    if (trusted.length > 0) {
        verifyChainToTrustedRoots(chain, trusted);
    }

    // JWS signature must verify against the leaf cert's public key.
    const leafPem = derToPem(x5c[0] as string);

    let key: Awaited<ReturnType<typeof importX509>>;
    try {
        key = await importX509(leafPem, asString(header.alg) ?? 'RS256');
    } catch (e) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            `Failed to import leaf X.509 cert: ${describe(e)}`,
            { cause: e }
        );
    }

    try {
        await jwtVerify(jws, key);
    } catch (e) {
        throw new RequestObjectError(
            'request_signature_invalid',
            `JWS signature verification failed: ${describe(e)}`,
            { cause: e }
        );
    }
};

const buildCertChain = async (
    x5c: string[]
): Promise<import('node:crypto').X509Certificate[]> => {
    const { X509Certificate } = await import('node:crypto');
    return x5c.map(b64 => new X509Certificate(new Uint8Array(Buffer.from(b64, 'base64'))));
};

/**
 * Walk the `x5c` chain bottom-up: each cert must be issued by the next,
 * and the topmost cert must be issued by one of the trusted roots.
 * Throws {@link RequestObjectError} on any broken link.
 */
const verifyChainToTrustedRoots = (
    chain: import('node:crypto').X509Certificate[],
    trustedPems: readonly string[]
): void => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { X509Certificate } = require('node:crypto') as typeof import('node:crypto');

    const trusted = trustedPems.map(pem => new X509Certificate(pem));

    for (let i = 0; i < chain.length - 1; i++) {
        const child = chain[i]!;
        const parent = chain[i + 1]!;
        if (!child.checkIssued(parent) || !child.verify(parent.publicKey)) {
            throw new RequestObjectError(
                'request_signer_untrusted',
                `x5c chain broken at position ${i}: cert is not signed by its successor`
            );
        }
    }

    const top = chain[chain.length - 1]!;

    // Self-anchored leaf → the leaf must itself match a trusted root.
    if (chain.length === 1) {
        const match = trusted.find(
            root => root.fingerprint256 === top.fingerprint256
        );
        if (!match) {
            throw new RequestObjectError(
                'request_signer_untrusted',
                'Leaf certificate is self-contained and does not match any trustedX509Roots'
            );
        }
        return;
    }

    const anchor = trusted.find(
        root =>
            top.checkIssued(root) &&
            (() => {
                try {
                    return top.verify(root.publicKey);
                } catch {
                    return false;
                }
            })()
    );

    if (!anchor) {
        throw new RequestObjectError(
            'request_signer_untrusted',
            'Top of x5c chain is not rooted in any trustedX509Roots'
        );
    }
};

const derToPem = (b64: string): string => {
    // b64 comes verbatim from the JWS header — unwrap any stray newlines
    // and re-chunk to classic 64-char PEM lines.
    const clean = b64.replace(/\s+/g, '');
    const lines = clean.match(/.{1,64}/g) ?? [clean];
    return `-----BEGIN CERTIFICATE-----\n${lines.join('\n')}\n-----END CERTIFICATE-----\n`;
};

const hostFromClientId = (clientId: string): string => {
    // client_id can be a hostname, URL, or URL with path. Pull a DNS
    // name out in every reasonable shape.
    try {
        const url = new URL(
            clientId.includes('://') ? clientId : `https://${clientId}`
        );
        return url.hostname;
    } catch {
        return clientId;
    }
};

/* -------------------------------------------------------------------------- */
/*                              built-in resolver                             */
/* -------------------------------------------------------------------------- */

/**
 * Built-in DID resolver covering the two methods wallet-side holder
 * traffic most often uses: `did:jwk` (keys inline in the identifier)
 * and `did:web` (DID docs over HTTPS). Other methods should be handled
 * via the caller's `didResolver` override.
 */
export const builtInDidResolver = (
    fetchImpl: typeof fetch | undefined = globalThis.fetch
): DidResolver => {
    return async (did: string): Promise<DidDocument> => {
        if (did.startsWith('did:jwk:')) {
            return resolveDidJwk(did);
        }
        if (did.startsWith('did:web:')) {
            return resolveDidWeb(did, fetchImpl);
        }
        throw new RequestObjectError(
            'did_resolution_failed',
            `Built-in resolver does not support ${did.split(':').slice(0, 2).join(':')} — pass a custom didResolver`
        );
    };
};

const resolveDidJwk = (did: string): DidDocument => {
    const id = did.replace(/^did:jwk:/, '').split('#')[0]!;

    let jwk: JWK;
    try {
        const pad = '='.repeat((4 - (id.length % 4)) % 4);
        const b64 = id.replace(/-/g, '+').replace(/_/g, '/') + pad;
        jwk = JSON.parse(Buffer.from(b64, 'base64').toString('utf8')) as JWK;
    } catch (e) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `Failed to decode did:jwk identifier: ${describe(e)}`,
            { cause: e }
        );
    }

    const vmId = `${did}#0`;
    return {
        id: did,
        verificationMethod: [
            {
                id: vmId,
                type: 'JsonWebKey2020',
                controller: did,
                publicKeyJwk: jwk,
            },
        ],
        authentication: [vmId],
        assertionMethod: [vmId],
    };
};

const resolveDidWeb = async (
    did: string,
    fetchImpl: typeof fetch | undefined
): Promise<DidDocument> => {
    if (typeof fetchImpl !== 'function') {
        throw new RequestObjectError(
            'did_resolution_failed',
            'did:web resolution requires a fetch implementation'
        );
    }

    // did:web:example.com                  → https://example.com/.well-known/did.json
    // did:web:example.com:user:alice       → https://example.com/user/alice/did.json
    // did:web:example.com%3A8080           → https://example.com:8080/.well-known/did.json
    const rest = did.replace(/^did:web:/, '');
    const segments = rest.split(':').map(s => decodeURIComponent(s));

    const host = segments.shift()!;
    const path =
        segments.length === 0 ? '/.well-known/did.json' : `/${segments.join('/')}/did.json`;

    const url = `https://${host}${path}`;

    let res: Response;
    try {
        res = await fetchImpl(url, { method: 'GET' });
    } catch (e) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `Failed to fetch ${url}: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!res.ok) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `${url} returned ${res.status} ${res.statusText}`
        );
    }

    let json: unknown;
    try {
        json = await res.json();
    } catch (e) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `${url} response was not JSON: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        throw new RequestObjectError(
            'did_resolution_failed',
            `${url} response was not a DID Document object`
        );
    }

    return json as DidDocument;
};

/* -------------------------------------------------------------------------- */
/*                        claims → AuthorizationRequest                       */
/* -------------------------------------------------------------------------- */

const buildRequestFromClaims = (
    clientId: string,
    clientIdScheme: string,
    claims: Record<string, unknown>
): AuthorizationRequest => {
    const presentationDefinition =
        isObject(claims.presentation_definition)
            ? (claims.presentation_definition as unknown as PresentationDefinition)
            : undefined;

    const clientMetadata =
        isObject(claims.client_metadata)
            ? (claims.client_metadata as Record<string, unknown>)
            : undefined;

    return {
        client_id: clientId,
        client_id_scheme: clientIdScheme,
        response_type: asString(claims.response_type) ?? 'vp_token',
        response_mode: asString(claims.response_mode),
        response_uri: asString(claims.response_uri),
        redirect_uri: asString(claims.redirect_uri),
        nonce: asString(claims.nonce) ?? '',
        state: asString(claims.state),
        presentation_definition: presentationDefinition,
        presentation_definition_uri: asString(claims.presentation_definition_uri),
        client_metadata: clientMetadata,
        client_metadata_uri: asString(claims.client_metadata_uri),
        scope: asString(claims.scope),
    };
};

/* -------------------------------------------------------------------------- */
/*                                 tiny utils                                 */
/* -------------------------------------------------------------------------- */

const asString = (v: unknown): string | undefined =>
    typeof v === 'string' && v.length > 0 ? v : undefined;

const isObject = (v: unknown): v is Record<string, unknown> =>
    v !== null && typeof v === 'object' && !Array.isArray(v);

const looksLikeJws = (s: string): boolean =>
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s);

const b64urlDecode = (b64: string): string => {
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const std = b64.replace(/-/g, '+').replace(/_/g, '/') + pad;
    return Buffer.from(std, 'base64').toString('utf8');
};

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));
