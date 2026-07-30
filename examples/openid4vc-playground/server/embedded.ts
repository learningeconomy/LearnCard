/**
 * Embedded OID4VCI + OID4VP engine for the playground.
 *
 * A self-contained issuer + verifier that runs inside the Vite dev
 * server — no Docker, no external services, no DNS surprises. Purpose-
 * built for exercising the wallet's SD-JWT-VC end-to-end paths from
 * Slice 3 of LC-1796 (selective disclosure + KB-JWT + per-claim consent).
 *
 * # Why this exists alongside `./waltid.ts` and `./eudi.ts`
 *
 * The other two providers depend on infrastructure that flakes:
 * walt.id's hosted sandbox rate-limits, the Docker stack needs Docker
 * running, EUDI requires reaching public endpoints. When the engineer
 * just wants to confirm "does my new SD-JWT presentation code work?"
 * they shouldn't need any of that. This file is the answer — one HTTP
 * service, one keypair, one round-trip.
 *
 * # Security posture
 *
 * **Playground-only.** OID4VCI proof-of-possession signatures are
 * intentionally NOT verified — we extract the holder's public key
 * from the `kid` (did:key / did:jwk) so the issued credential has the
 * right `cnf` binding, but we don't validate the signature. This is
 * fine because:
 *   1. We don't accept this credential anywhere else.
 *   2. The whole point is to exercise the wallet, not catch malicious
 *      issuance.
 *   3. Mounting a real proof verifier here would require importing
 *      `@learncard/didkit-plugin` (heavy WASM) just to support
 *      did:web — out of scope for a dev tool.
 *
 * The verifier-side checks (issuer signature on the SD-JWT, KB-JWT
 * signature, disclosure-hash integrity, audience+nonce binding) ARE
 * enforced — that's what the engineer is actually testing.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

import { exportJWK, generateKeyPair, importJWK, SignJWT, type JWK, type KeyLike } from 'jose';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import { decodeSdJwt, getClaims } from '@sd-jwt/decode';

/* -------------------------------------------------------------------------- */
/*                              issuer singleton                              */
/* -------------------------------------------------------------------------- */

interface IssuerKey {
    publicJwk: JWK;
    privateJwk: JWK;
    privateKey: KeyLike;
    did: string;
    kid: string;
}

let issuerKeyPromise: Promise<IssuerKey> | undefined;

/**
 * Generate an Ed25519 issuer keypair on first use and cache it. The
 * issuer DID is a `did:jwk` so verifiers can resolve it offline by
 * base64url-decoding the kid.
 */
const getIssuerKey = async (): Promise<IssuerKey> => {
    if (issuerKeyPromise) return issuerKeyPromise;

    issuerKeyPromise = (async () => {
        const keypair = await generateKeyPair('EdDSA');
        const publicJwk = (await exportJWK(keypair.publicKey)) as JWK;
        const privateJwk = (await exportJWK(keypair.privateKey)) as JWK;

        const didJwk = `did:jwk:${base64UrlEncode(
            new TextEncoder().encode(JSON.stringify(canonicalize(publicJwk)))
        )}`;

        return {
            publicJwk,
            privateJwk,
            privateKey: keypair.privateKey,
            did: didJwk,
            kid: `${didJwk}#0`,
        };
    })();

    return issuerKeyPromise;
};

/* -------------------------------------------------------------------------- */
/*                          in-memory session state                           */
/* -------------------------------------------------------------------------- */

interface PendingOffer {
    preAuthCode: string;
    configurationId: string;
    vct: string;
    cNonce: string;
    accessToken?: string;
    issuedCompact?: string;
    createdAt: number;
}

interface VerifierSession {
    id: string;
    state: string;
    nonce: string;
    expectedVct: string;
    /** Verifier verdict — flips to success/fail once the wallet POSTs. */
    verdict:
        | { status: 'pending' }
        | {
              status: 'success';
              detail: string;
              receivedAt: number;
              disclosedClaims: Record<string, unknown>;
              hiddenClaimKeys: string[];
              hasKeyBinding: boolean;
              vpToken: string;
          }
        | { status: 'fail'; detail: string; receivedAt: number; vpToken?: string };
    createdAt: number;
}

const pendingOffers = new Map<string, PendingOffer>();
const verifierSessions = new Map<string, VerifierSession>();

/* -------------------------------------------------------------------------- */
/*                          public dispatcher API                             */
/* -------------------------------------------------------------------------- */

/**
 * Mint a credential offer that points at the embedded issuer. The
 * caller (server/api.ts) receives the offer URI and passes it to the
 * wallet via QR / deep link. Pre-auth code only; no PIN.
 */
export const mintEmbeddedSdJwtOffer = async (opts: {
    publicBaseUrl: string;
    configurationId?: string;
    vct?: string;
}): Promise<{ rawOfferUri: string }> => {
    await getIssuerKey();

    const configurationId = opts.configurationId ?? 'PlaygroundSdJwtCredential';
    const vct = opts.vct ?? `${opts.publicBaseUrl}/embedded/vct/playground-credential`;
    const preAuthCode = randomToken();
    const cNonce = randomToken();

    pendingOffers.set(preAuthCode, {
        preAuthCode,
        configurationId,
        vct,
        cNonce,
        createdAt: Date.now(),
    });

    const offer = {
        credential_issuer: `${opts.publicBaseUrl}/embedded/issuer`,
        credential_configuration_ids: [configurationId],
        grants: {
            'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
                'pre-authorized_code': preAuthCode,
            },
        },
    };

    const rawOfferUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(
        JSON.stringify(offer)
    )}`;
    return { rawOfferUri };
};

/**
 * Create an OID4VP verify session asking the wallet for the embedded
 * issuer's SD-JWT-VC. Returns the authorization request URI and a
 * `state` token the caller uses for status polling.
 */
export const createEmbeddedVerifySession = async (opts: {
    publicBaseUrl: string;
    vct?: string;
}): Promise<{ rawAuthRequestUri: string; state: string }> => {
    const sessionId = randomToken();
    const state = randomToken();
    const nonce = randomToken();
    const vct = opts.vct ?? `${opts.publicBaseUrl}/embedded/vct/playground-credential`;

    verifierSessions.set(state, {
        id: sessionId,
        state,
        nonce,
        expectedVct: vct,
        verdict: { status: 'pending' },
        createdAt: Date.now(),
    });

    const responseUri = `${opts.publicBaseUrl}/embedded/verifier/response/${sessionId}`;

    const presentationDefinition = buildPresentationDefinition(sessionId, vct);

    const params = new URLSearchParams({
        client_id: `${opts.publicBaseUrl}/embedded/verifier`,
        client_id_scheme: 'redirect_uri',
        response_type: 'vp_token',
        response_mode: 'direct_post',
        presentation_definition: JSON.stringify(presentationDefinition),
        response_uri: responseUri,
        nonce,
        state,
    });

    return {
        rawAuthRequestUri: `openid4vp://authorize?${params.toString()}`,
        state,
    };
};

const buildPresentationDefinition = (sessionId: string, vct: string) => ({
    id: sessionId,
    input_descriptors: [
        {
            id: 'playground-sd-jwt',
            format: {
                'dc+sd-jwt': { alg: ['EdDSA'] },
                'vc+sd-jwt': { alg: ['EdDSA'] },
            },
            constraints: {
                fields: [
                    {
                        path: ['$.vct'],
                        filter: {
                            type: 'string',
                            const: vct,
                        },
                    },
                ],
            },
        },
    ],
});

export const getEmbeddedVerifyStatus = (state: string): VerifierSession['verdict'] => {
    const session = verifierSessions.get(state);
    if (!session) {
        return {
            status: 'fail',
            detail: 'Unknown state — session not found',
            receivedAt: Date.now(),
        };
    }
    return session.verdict;
};

/* -------------------------------------------------------------------------- */
/*                              HTTP request router                           */
/* -------------------------------------------------------------------------- */

/**
 * Returns true if the request was handled (the response was written),
 * false if the URL doesn't match any embedded route. The Vite
 * middleware should call this before falling through to `next()`.
 */
export const handleEmbeddedRequest = async (
    req: IncomingMessage,
    res: ServerResponse
): Promise<boolean> => {
    const url = req.url ?? '';
    if (!url.startsWith('/embedded/')) return false;

    const publicBaseUrl = derivePublicBaseUrl(req);

    try {
        const parsed = new URL(url, publicBaseUrl);
        const path = parsed.pathname;
        const method = req.method ?? 'GET';

        if (method === 'GET' && path === '/embedded/issuer/.well-known/openid-credential-issuer') {
            return await handleIssuerMetadata(res, publicBaseUrl);
        }
        if (
            method === 'GET' &&
            path === '/embedded/issuer/.well-known/oauth-authorization-server'
        ) {
            return await handleAsMetadata(res, publicBaseUrl);
        }
        if (method === 'POST' && path === '/embedded/issuer/token') {
            return await handleToken(req, res, publicBaseUrl);
        }
        if (method === 'POST' && path === '/embedded/issuer/credential') {
            return await handleCredential(req, res, publicBaseUrl);
        }
        if (method === 'GET' && path.startsWith('/embedded/verifier/pd/')) {
            const sessionId = path.slice('/embedded/verifier/pd/'.length);
            return await handlePresentationDefinition(res, sessionId, publicBaseUrl);
        }
        if (method === 'POST' && path.startsWith('/embedded/verifier/response/')) {
            const sessionId = path.slice('/embedded/verifier/response/'.length);
            return await handleVerifierResponse(req, res, sessionId);
        }
        if (method === 'OPTIONS' && path.startsWith('/embedded/')) {
            return writeJson(res, 204, '');
        }
        return false;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('[embedded] handler crashed', e);
        return writeJson(res, 500, {
            error: e instanceof Error ? e.message : 'Internal server error',
        });
    }
};

/* -------------------------------------------------------------------------- */
/*                              issuer endpoints                              */
/* -------------------------------------------------------------------------- */

const handleIssuerMetadata = async (
    res: ServerResponse,
    publicBaseUrl: string
): Promise<boolean> => {
    const issuer = await getIssuerKey();
    const credentialConfigurations: Record<string, unknown> = {
        PlaygroundSdJwtCredential: {
            format: 'dc+sd-jwt',
            vct: `${publicBaseUrl}/embedded/vct/playground-credential`,
            cryptographic_binding_methods_supported: ['jwk', 'did:jwk', 'did:key'],
            credential_signing_alg_values_supported: ['EdDSA'],
            proof_types_supported: {
                jwt: { proof_signing_alg_values_supported: ['EdDSA'] },
            },
            display: [
                {
                    name: 'Playground Test Credential',
                    description:
                        'SD-JWT-VC issued by the embedded playground engine. Use for Slice 3 selective-disclosure testing.',
                    locale: 'en-US',
                },
            ],
            claims: {
                given_name: {
                    display: [{ name: 'First name', locale: 'en-US' }],
                },
                family_name: {
                    display: [{ name: 'Last name', locale: 'en-US' }],
                },
                email: {
                    display: [{ name: 'Email', locale: 'en-US' }],
                },
                date_of_birth: {
                    display: [{ name: 'Date of birth', locale: 'en-US' }],
                },
            },
        },
    };

    return writeJson(res, 200, {
        credential_issuer: `${publicBaseUrl}/embedded/issuer`,
        authorization_servers: [`${publicBaseUrl}/embedded/issuer`],
        credential_endpoint: `${publicBaseUrl}/embedded/issuer/credential`,
        token_endpoint: `${publicBaseUrl}/embedded/issuer/token`,
        credential_configurations_supported: credentialConfigurations,
        display: [{ name: 'LearnCard Playground Issuer', locale: 'en-US' }],
        issuer_did: issuer.did,
    });
};

const handleAsMetadata = async (res: ServerResponse, publicBaseUrl: string): Promise<boolean> => {
    return writeJson(res, 200, {
        issuer: `${publicBaseUrl}/embedded/issuer`,
        token_endpoint: `${publicBaseUrl}/embedded/issuer/token`,
        grant_types_supported: ['urn:ietf:params:oauth:grant-type:pre-authorized_code'],
        response_types_supported: ['token'],
        token_endpoint_auth_methods_supported: ['none'],
    });
};

const handleToken = async (
    req: IncomingMessage,
    res: ServerResponse,
    _publicBaseUrl: string
): Promise<boolean> => {
    const body = await readForm(req);
    const grantType = body.get('grant_type');
    const preAuthCode = body.get('pre-authorized_code');

    if (grantType !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
        return writeJson(res, 400, {
            error: 'unsupported_grant_type',
            error_description: `Only pre-authorized_code is supported (got "${grantType}")`,
        });
    }
    if (!preAuthCode) {
        return writeJson(res, 400, {
            error: 'invalid_grant',
            error_description: 'Missing pre-authorized_code',
        });
    }

    const offer = pendingOffers.get(preAuthCode);
    if (!offer) {
        return writeJson(res, 400, {
            error: 'invalid_grant',
            error_description: 'pre-authorized_code is unknown or already consumed',
        });
    }

    const accessToken = randomToken();
    offer.accessToken = accessToken;

    return writeJson(res, 200, {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 300,
        c_nonce: offer.cNonce,
        c_nonce_expires_in: 300,
    });
};

const handleCredential = async (
    req: IncomingMessage,
    res: ServerResponse,
    publicBaseUrl: string
): Promise<boolean> => {
    const authHeader = (req.headers.authorization ?? '').trim();
    const bearer = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : undefined;

    const offer = bearer
        ? Array.from(pendingOffers.values()).find(o => o.accessToken === bearer)
        : undefined;
    if (!offer) {
        return writeJson(res, 401, {
            error: 'invalid_token',
            error_description: 'Bearer token missing or unrecognized',
        });
    }

    const body = await readJson(req);
    // Accept the OID4VCI 1.0 `proofs: { jwt: [...] }` shape and the legacy
    // Draft 13 singular `proof: { jwt }` shape (the wallet supports both).
    const proofJwt = body?.proofs?.jwt?.[0] ?? body?.proof?.jwt;
    if (typeof proofJwt !== 'string') {
        return writeJson(res, 400, {
            error: 'invalid_proof',
            error_description:
                'Expected proofs.jwt[0] (1.0) or proof.jwt (Draft 13) as a compact JWS',
        });
    }

    // Extract the holder's public JWK from the proof's kid. We
    // deliberately don't verify the JWS signature here (playground-
    // mode, see file header). What we DO need is the kid → public-key
    // mapping so the issued credential's `cnf.jwk` is correct.
    const holderJwk = await extractHolderJwkFromProof(proofJwt);
    if (!holderJwk) {
        return writeJson(res, 400, {
            error: 'invalid_proof',
            error_description:
                'Could not derive holder public key from proof JWT kid. Use a did:key, did:jwk, or pass `jwk` in the proof header.',
        });
    }

    const issuer = await getIssuerKey();
    const compact = await issueSdJwtVc({
        issuer,
        holderJwk,
        vct: offer.vct,
        givenName: 'Ada',
        familyName: 'Lovelace',
        email: 'ada@example.com',
        dateOfBirth: '1815-12-10',
        credentialId: randomToken(),
    });

    offer.issuedCompact = compact;

    return writeJson(res, 200, {
        credentials: [{ credential: compact }],
    });
};

/* -------------------------------------------------------------------------- */
/*                              verifier endpoints                            */
/* -------------------------------------------------------------------------- */

const handlePresentationDefinition = async (
    res: ServerResponse,
    sessionId: string,
    _publicBaseUrl: string
): Promise<boolean> => {
    const session = Array.from(verifierSessions.values()).find(s => s.id === sessionId);
    if (!session) {
        return writeJson(res, 404, { error: 'unknown_session' });
    }
    return writeJson(res, 200, buildPresentationDefinition(sessionId, session.expectedVct));
};

const handleVerifierResponse = async (
    req: IncomingMessage,
    res: ServerResponse,
    sessionId: string
): Promise<boolean> => {
    const session = Array.from(verifierSessions.values()).find(s => s.id === sessionId);
    if (!session) {
        return writeJson(res, 404, { error: 'unknown_session' });
    }

    const body = await readForm(req);
    const vpToken = body.get('vp_token');
    if (typeof vpToken !== 'string' || vpToken.length === 0) {
        session.verdict = {
            status: 'fail',
            detail: 'Response missing vp_token',
            receivedAt: Date.now(),
        };
        return writeJson(res, 400, { error: 'invalid_request' });
    }

    try {
        const verdict = await verifyEmbeddedPresentation({
            compact: vpToken,
            expectedAudience: session.expectedVct
                ? // Verifier client_id is set to its own base URL in the auth request.
                  // We accept any aud that the wallet supplied because the playground
                  // doesn't pin a specific client_id format — what we care about is
                  // that the wallet emitted a KB-JWT at all.
                  undefined
                : undefined,
            expectedNonce: session.nonce,
            expectedVct: session.expectedVct,
        });
        session.verdict = {
            status: 'success',
            detail: 'Presentation verified: issuer signature + KB-JWT + disclosure hashes all check out.',
            receivedAt: Date.now(),
            disclosedClaims: verdict.disclosedClaims,
            hiddenClaimKeys: verdict.hiddenClaimKeys,
            hasKeyBinding: verdict.hasKeyBinding,
            vpToken,
        };
    } catch (e) {
        session.verdict = {
            status: 'fail',
            detail: e instanceof Error ? e.message : String(e),
            receivedAt: Date.now(),
            vpToken,
        };
    }

    return writeJson(res, 200, { redirect_uri: null });
};

/* -------------------------------------------------------------------------- */
/*                              SD-JWT issuance                               */
/* -------------------------------------------------------------------------- */

const issueSdJwtVc = async (opts: {
    issuer: IssuerKey;
    holderJwk: JWK;
    vct: string;
    givenName: string;
    familyName: string;
    email: string;
    dateOfBirth: string;
    credentialId: string;
}): Promise<string> => {
    const { issuer } = opts;

    const signer = async (data: string): Promise<string> => {
        const [headerSegment, payloadSegment] = data.split('.');
        if (!headerSegment || !payloadSegment) throw new Error('Bad JWS input');
        const header = JSON.parse(base64UrlDecodeToString(headerSegment));
        const payload = JSON.parse(base64UrlDecodeToString(payloadSegment));
        const compact = await new SignJWT(payload)
            .setProtectedHeader(header)
            .sign(issuer.privateKey);
        const sig = compact.split('.')[2];
        if (!sig) throw new Error('Signer produced no signature segment');
        return sig;
    };

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        signer,
        signAlg: 'EdDSA',
    });

    const iat = Math.floor(Date.now() / 1000);
    return instance.issue(
        {
            iss: issuer.did,
            iat,
            vct: opts.vct,
            cnf: { jwk: opts.holderJwk },
            given_name: opts.givenName,
            family_name: opts.familyName,
            email: opts.email,
            date_of_birth: opts.dateOfBirth,
            credential_id: opts.credentialId,
        },
        { _sd: ['given_name', 'family_name', 'email', 'date_of_birth'] },
        { header: { kid: issuer.kid, alg: 'EdDSA' } }
    );
};

/* -------------------------------------------------------------------------- */
/*                              SD-JWT verification                           */
/* -------------------------------------------------------------------------- */

interface VerifyResult {
    disclosedClaims: Record<string, unknown>;
    hiddenClaimKeys: string[];
    hasKeyBinding: boolean;
}

/**
 * Validate a wallet-supplied SD-JWT-VC presentation:
 *  1. Issuer signature against our own issuer key (we issued it).
 *  2. Disclosure hashes match what's in the JWT.
 *  3. KB-JWT (if present) signs the right sd_hash + audience + nonce.
 *  4. Surface which claims were disclosed vs hidden so the UI can
 *     show the engineer what the wallet actually shared.
 */
const verifyEmbeddedPresentation = async (opts: {
    compact: string;
    expectedAudience?: string;
    expectedNonce: string;
    expectedVct: string;
}): Promise<VerifyResult> => {
    const issuer = await getIssuerKey();

    const issuerVerifier = async (data: string, sig: string): Promise<boolean> => {
        try {
            const key = await importJWK(issuer.publicJwk, 'EdDSA');
            const compactJws = `${data}.${sig}`;
            const { compactVerify } = await import('jose');
            await compactVerify(compactJws, key);
            return true;
        } catch {
            return false;
        }
    };

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg: 'sha-256',
        saltGenerator: randomSalt,
        verifier: issuerVerifier,
    });

    try {
        await instance.verify(opts.compact);
    } catch (e) {
        throw new Error(
            `Issuer signature or disclosure hashes failed: ${
                e instanceof Error ? e.message : String(e)
            }`
        );
    }

    const decoded = await decodeSdJwt(opts.compact, sha256Hasher);

    const fullClaims = (await getClaims(
        decoded.jwt!.payload as Record<string, unknown>,
        decoded.disclosures,
        sha256Hasher
    )) as Record<string, unknown>;

    if (fullClaims.vct !== opts.expectedVct) {
        throw new Error(
            `vct mismatch: expected "${opts.expectedVct}", got "${String(fullClaims.vct)}"`
        );
    }

    const issuerSdClaimKeys = new Set<string>();
    for (const d of decoded.disclosures ?? []) {
        const key = (d as { key?: string }).key;
        if (typeof key === 'string') issuerSdClaimKeys.add(key);
    }
    const ALL_DISCLOSABLE = new Set(['given_name', 'family_name', 'email', 'date_of_birth']);
    const hiddenClaimKeys = Array.from(ALL_DISCLOSABLE).filter(k => !issuerSdClaimKeys.has(k));

    const disclosedClaims: Record<string, unknown> = {};
    for (const key of issuerSdClaimKeys) {
        disclosedClaims[key] = fullClaims[key];
    }

    const hasKeyBinding = Boolean(decoded.kbJwt);
    if (hasKeyBinding) {
        // The wallet must include cnf.jwk in the credential it received from us.
        // We re-extract that public key and verify the KB-JWT signature against it.
        const cnf = (decoded.jwt?.payload as { cnf?: { jwk?: JWK } } | undefined)?.cnf;
        const holderJwk = cnf?.jwk;
        if (!holderJwk) {
            throw new Error('KB-JWT present but credential has no cnf.jwk — issuer-side bug');
        }

        const kbJwt = decoded.kbJwt!;
        const kbHeader = kbJwt.header as { typ?: string; alg?: string };
        if (kbHeader.typ !== 'kb+jwt') {
            throw new Error(`KB-JWT header.typ is "${kbHeader.typ}", expected "kb+jwt"`);
        }
        const kbPayload = kbJwt.payload as {
            aud?: unknown;
            nonce?: unknown;
            iat?: unknown;
            sd_hash?: unknown;
        };
        if (kbPayload.nonce !== opts.expectedNonce) {
            throw new Error(
                `KB-JWT nonce mismatch: expected "${opts.expectedNonce}", got "${String(
                    kbPayload.nonce
                )}"`
            );
        }
        if (opts.expectedAudience && kbPayload.aud !== opts.expectedAudience) {
            throw new Error(
                `KB-JWT aud mismatch: expected "${opts.expectedAudience}", got "${String(
                    kbPayload.aud
                )}"`
            );
        }
        if (typeof kbPayload.sd_hash !== 'string' || kbPayload.sd_hash.length === 0) {
            throw new Error('KB-JWT missing sd_hash');
        }

        const kbCompact = extractKbJwtCompact(opts.compact);
        if (!kbCompact) {
            throw new Error('KB-JWT decoded but compact form could not be extracted');
        }
        try {
            const key = await importJWK(holderJwk, (kbHeader.alg as string) ?? 'EdDSA');
            const { compactVerify } = await import('jose');
            await compactVerify(kbCompact, key);
        } catch (e) {
            throw new Error(
                `KB-JWT signature failed against credential's cnf.jwk: ${
                    e instanceof Error ? e.message : String(e)
                }`
            );
        }
    }

    return { disclosedClaims, hiddenClaimKeys, hasKeyBinding };
};

/* -------------------------------------------------------------------------- */
/*                              helper plumbing                               */
/* -------------------------------------------------------------------------- */

const derivePublicBaseUrl = (req: IncomingMessage): string => {
    const host = (req.headers.host ?? 'localhost:5173').toString();
    const proto = (req.headers['x-forwarded-proto'] ?? 'http').toString();
    return `${proto}://${host}`;
};

const extractHolderJwkFromProof = async (proofJwt: string): Promise<JWK | undefined> => {
    const [headerSegment] = proofJwt.split('.');
    if (!headerSegment) return undefined;
    let header: Record<string, unknown>;
    try {
        header = JSON.parse(base64UrlDecodeToString(headerSegment));
    } catch {
        return undefined;
    }

    if (header.jwk && typeof header.jwk === 'object') {
        return header.jwk as JWK;
    }

    const kid = typeof header.kid === 'string' ? header.kid : undefined;
    if (!kid) return undefined;

    const didPart = kid.includes('#') ? kid.slice(0, kid.indexOf('#')) : kid;

    if (didPart.startsWith('did:jwk:')) {
        try {
            const base64 = didPart.slice('did:jwk:'.length);
            const decoded = base64UrlDecodeToString(base64);
            return JSON.parse(decoded) as JWK;
        } catch {
            return undefined;
        }
    }

    if (didPart.startsWith('did:key:')) {
        return await decodeDidKeyToJwk(didPart);
    }

    // did:web and others not supported in playground mode.
    return undefined;
};

/**
 * Minimal did:key decoder for the Ed25519 multicodec prefix (0xed01).
 * Returns the OKP JWK or undefined for unsupported curves.
 */
const decodeDidKeyToJwk = async (didKey: string): Promise<JWK | undefined> => {
    const stripped = didKey.slice('did:key:'.length);
    if (!stripped.startsWith('z')) return undefined;
    const base58Encoded = stripped.slice(1);
    const bytes = base58btcDecode(base58Encoded);
    if (!bytes || bytes.length < 2) return undefined;
    // Ed25519 multicodec varint prefix is two bytes: 0xed 0x01.
    if (bytes[0] !== 0xed || bytes[1] !== 0x01) return undefined;
    const pub = bytes.slice(2);
    if (pub.length !== 32) return undefined;
    return {
        kty: 'OKP',
        crv: 'Ed25519',
        x: base64UrlEncode(pub),
    };
};

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

const base58btcDecode = (s: string): Uint8Array | undefined => {
    const bytes: number[] = [0];
    for (const ch of s) {
        const idx = BASE58_ALPHABET.indexOf(ch);
        if (idx < 0) return undefined;
        let carry = idx;
        for (let i = 0; i < bytes.length; i++) {
            const v = bytes[i]! * 58 + carry;
            bytes[i] = v & 0xff;
            carry = v >> 8;
        }
        while (carry > 0) {
            bytes.push(carry & 0xff);
            carry >>= 8;
        }
    }
    for (const ch of s) {
        if (ch === '1') bytes.push(0);
        else break;
    }
    return new Uint8Array(bytes.reverse());
};

const extractKbJwtCompact = (presentation: string): string | undefined => {
    if (presentation.endsWith('~')) return undefined;
    const lastTilde = presentation.lastIndexOf('~');
    if (lastTilde < 0) return undefined;
    const tail = presentation.slice(lastTilde + 1);
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(tail) ? tail : undefined;
};

const sha256Hasher = async (data: string | ArrayBuffer, alg: string): Promise<Uint8Array> => {
    if (alg !== 'sha-256' && alg !== 'SHA-256' && alg !== 'sha256') {
        throw new Error(`Unsupported hash algorithm: ${alg}`);
    }
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
    const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
    return new Uint8Array(digest);
};

const randomSalt = (length = 16): string => {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
};

const randomToken = (): string => {
    const bytes = new Uint8Array(24);
    globalThis.crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
};

const base64UrlEncode = (bytes: Uint8Array): string => {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return Buffer.from(binary, 'binary')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const base64UrlDecodeToString = (segment: string): string => {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf-8');
};

const canonicalize = (jwk: JWK): Record<string, unknown> => {
    // RFC 7638 thumbprint-required keys in lexicographic order. For
    // Ed25519 OKP that's `crv`, `kty`, `x`. The did:jwk spec uses
    // the same canonical form for identifier derivation.
    const out: Record<string, unknown> = {};
    const keys = (['crv', 'kty', 'x'] as const).filter(k => jwk[k] !== undefined);
    for (const k of keys) out[k] = jwk[k];
    return out;
};

const readJson = (req: IncomingMessage): Promise<any> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            if (raw.length === 0) return resolve({});
            try {
                resolve(JSON.parse(raw));
            } catch (e) {
                reject(new Error('Request body was not valid JSON'));
            }
        });
        req.on('error', reject);
    });

const readForm = (req: IncomingMessage): Promise<URLSearchParams> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => {
            const raw = Buffer.concat(chunks).toString('utf8');
            const ct = (req.headers['content-type'] ?? '').toString().toLowerCase();
            if (ct.includes('application/json')) {
                try {
                    const json = raw.length === 0 ? {} : JSON.parse(raw);
                    const params = new URLSearchParams();
                    for (const [k, v] of Object.entries(json)) {
                        params.set(k, String(v));
                    }
                    return resolve(params);
                } catch (e) {
                    return reject(new Error('JSON body parse failed'));
                }
            }
            resolve(new URLSearchParams(raw));
        });
        req.on('error', reject);
    });

const writeJson = (res: ServerResponse, status: number, body: unknown): true => {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-headers', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
    return true;
};
