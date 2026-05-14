/**
 * Minimum OpenID4VCI Issuer for e2e tests.
 *
 * Implements just enough of Draft 13 to exercise the plugin's real
 * HTTP surface end-to-end:
 *   GET  /.well-known/openid-credential-issuer      (issuer metadata)
 *   GET  /.well-known/oauth-authorization-server    (AS metadata)
 *   GET  /credentialOffer/:id                       (by-reference offers)
 *   POST /token                                     (pre-auth + auth_code)
 *   POST /credential                                (synchronous jwt_vc_json)
 *   GET  /authorize                                 (auth_code flow entry)
 *
 * In-memory state only. One shared issuer key issues all VCs. Offers,
 * codes, and access tokens are short-lived random strings held in a
 * Map; nothing here is production-grade. If you're reading this as
 * reference for a real issuer, please stop.
 */
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import type { JWK } from 'jose';

/* -------------------------------------------------------------------------- */
/*                                state                                       */
/* -------------------------------------------------------------------------- */

export interface IssuerState {
    origin: string;
    did: string;
    kid: string;
    privateKey: CryptoKey;
    publicJwk: JWK;
    offers: Map<string, StoredOffer>;
    preAuthCodes: Map<string, PreAuthGrant>;
    authCodes: Map<string, AuthCodeGrant>;
    accessTokens: Map<string, IssuedToken>;
    authRequests: Map<string, PendingAuthRequest>;
}

interface StoredOffer {
    credential_issuer: string;
    credential_configuration_ids: string[];
    grants: Record<string, unknown>;
}

interface PreAuthGrant {
    configurationIds: string[];
    txCode?: string;
}

interface AuthCodeGrant {
    configurationIds: string[];
    codeChallenge: string;
    codeChallengeMethod: 'S256' | 'plain';
    redirectUri: string;
}

interface IssuedToken {
    configurationIds: string[];
    cNonce: string;
    expiresAt: number;
}

interface PendingAuthRequest {
    configurationIds: string[];
    codeChallenge: string;
    codeChallengeMethod: 'S256' | 'plain';
    redirectUri: string;
    state?: string;
}

/* -------------------------------------------------------------------------- */
/*                             public bootstrap                               */
/* -------------------------------------------------------------------------- */

export const createIssuerState = async (origin: string): Promise<IssuerState> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const publicJwk = await exportJWK(publicKey);
    const did = 'did:jwk:' + toB64url(JSON.stringify(publicJwk));
    const kid = `${did}#0`;

    return {
        origin,
        did,
        kid,
        privateKey,
        publicJwk,
        offers: new Map(),
        preAuthCodes: new Map(),
        authCodes: new Map(),
        accessTokens: new Map(),
        authRequests: new Map(),
    };
};

/**
 * Admin helper — mint a pre-auth credential offer. Tests call this
 * to set up a scenario, then hand the wallet the returned offer URI.
 */
export const createPreAuthOffer = (
    state: IssuerState,
    options: { configurationId: string; txCode?: string }
): { offerUri: string; preAuthCode: string; offerId: string } => {
    const offerId = randomId();
    const preAuthCode = randomId();

    const grants: Record<string, unknown> = {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': preAuthCode,
            ...(options.txCode !== undefined
                ? { tx_code: { input_mode: 'numeric', length: options.txCode.length } }
                : {}),
        },
    };

    const offer: StoredOffer = {
        credential_issuer: state.origin,
        credential_configuration_ids: [options.configurationId],
        grants,
    };

    state.offers.set(offerId, offer);
    state.preAuthCodes.set(preAuthCode, {
        configurationIds: [options.configurationId],
        txCode: options.txCode,
    });

    // Hand the wallet a real OID4VCI by-value offer URI. We can't use
    // credential_offer_uri (by-reference) because the plugin's parser
    // mandates https:// for that field and our in-process test server
    // runs on plain http://127.0.0.1:<port>.
    const offerUri =
        'openid-credential-offer://?credential_offer=' +
        encodeURIComponent(JSON.stringify(offer));

    return { offerUri, preAuthCode, offerId };
};

/**
 * Admin helper — mint an auth_code + PKCE credential offer. The
 * returned `offerUri` is what the wallet ingests; the wallet then
 * redirects the user-agent to `${origin}/authorize?...` to kick off
 * the OAuth dance.
 */
export const createAuthCodeOffer = (
    state: IssuerState,
    options: { configurationId: string }
): { offerUri: string; offerId: string } => {
    const offerId = randomId();

    const offer: StoredOffer = {
        credential_issuer: state.origin,
        credential_configuration_ids: [options.configurationId],
        grants: {
            authorization_code: {
                // issuer_state is OID4VCI's way of stapling the auth
                // request back to the offer; we echo it verbatim.
                issuer_state: offerId,
            },
        },
    };

    state.offers.set(offerId, offer);

    // By-value offer URI (see comment in createPreAuthOffer).
    const offerUri =
        'openid-credential-offer://?credential_offer=' +
        encodeURIComponent(JSON.stringify(offer));

    return { offerUri, offerId };
};

/* -------------------------------------------------------------------------- */
/*                               HTTP handlers                                */
/* -------------------------------------------------------------------------- */

export interface HandlerContext {
    state: IssuerState;
    method: string;
    path: string;
    query: URLSearchParams;
    body: string;
    headers: Record<string, string>;
}

export interface HandlerResponse {
    status: number;
    body: unknown;
    contentType?: string;
}

export const handleIssuerRequest = async (
    ctx: HandlerContext
): Promise<HandlerResponse | null> => {
    const { method, path } = ctx;

    if (method === 'GET' && path === '/.well-known/openid-credential-issuer') {
        return { status: 200, body: issuerMetadata(ctx.state) };
    }

    if (method === 'GET' && path === '/.well-known/oauth-authorization-server') {
        return { status: 200, body: asMetadata(ctx.state) };
    }

    if (method === 'GET' && path.startsWith('/credentialOffer/')) {
        const id = path.slice('/credentialOffer/'.length);
        const offer = ctx.state.offers.get(id);
        if (!offer) return { status: 404, body: { error: 'offer_not_found' } };
        return { status: 200, body: offer };
    }

    if (method === 'POST' && path === '/token') {
        return handleToken(ctx);
    }

    if (method === 'POST' && path === '/credential') {
        return handleCredential(ctx);
    }

    if (method === 'GET' && path === '/authorize') {
        return handleAuthorize(ctx);
    }

    return null;
};

/* -------------------------------------------------------------------------- */

const issuerMetadata = (state: IssuerState) => ({
    credential_issuer: state.origin,
    credential_endpoint: `${state.origin}/credential`,
    authorization_servers: [state.origin],
    credential_configurations_supported: {
        UniversityDegree_jwt: {
            format: 'jwt_vc_json',
            scope: 'UniversityDegree',
            cryptographic_binding_methods_supported: ['did:jwk'],
            credential_signing_alg_values_supported: ['EdDSA'],
            credential_definition: {
                type: ['VerifiableCredential', 'UniversityDegree'],
            },
            proof_types_supported: {
                jwt: { proof_signing_alg_values_supported: ['EdDSA'] },
            },
        },
    },
});

const asMetadata = (state: IssuerState) => ({
    issuer: state.origin,
    token_endpoint: `${state.origin}/token`,
    authorization_endpoint: `${state.origin}/authorize`,
    grant_types_supported: [
        'urn:ietf:params:oauth:grant-type:pre-authorized_code',
        'authorization_code',
    ],
    response_types_supported: ['code'],
    code_challenge_methods_supported: ['S256'],
    'pre-authorized_grant_anonymous_access_supported': true,
});

/* -------------------------------- /token ---------------------------------- */

const handleToken = async (ctx: HandlerContext): Promise<HandlerResponse> => {
    const form = new URLSearchParams(ctx.body);
    const grantType = form.get('grant_type');

    if (grantType === 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
        const code = form.get('pre-authorized_code');
        if (!code) return oauthError('invalid_request', 'pre-authorized_code missing');

        const grant = ctx.state.preAuthCodes.get(code);
        if (!grant) return oauthError('invalid_grant', 'pre-authorized_code not found');

        if (grant.txCode !== undefined) {
            const provided = form.get('tx_code');
            if (provided !== grant.txCode) {
                return oauthError('invalid_grant', 'tx_code mismatch');
            }
        }

        // One-shot redemption.
        ctx.state.preAuthCodes.delete(code);

        return issueAccessToken(ctx.state, grant.configurationIds);
    }

    if (grantType === 'authorization_code') {
        const code = form.get('code');
        const verifier = form.get('code_verifier');
        const redirectUri = form.get('redirect_uri');

        if (!code || !verifier) {
            return oauthError('invalid_request', 'code + code_verifier required');
        }

        const grant = ctx.state.authCodes.get(code);
        if (!grant) return oauthError('invalid_grant', 'authorization_code not found');

        if (redirectUri !== undefined && redirectUri !== grant.redirectUri) {
            return oauthError('invalid_grant', 'redirect_uri mismatch');
        }

        if (!(await verifyPkce(verifier, grant.codeChallenge, grant.codeChallengeMethod))) {
            return oauthError('invalid_grant', 'PKCE verification failed');
        }

        ctx.state.authCodes.delete(code);

        return issueAccessToken(ctx.state, grant.configurationIds);
    }

    return oauthError('unsupported_grant_type', `grant_type=${grantType}`);
};

const issueAccessToken = (
    state: IssuerState,
    configurationIds: string[]
): HandlerResponse => {
    const accessToken = randomId();
    const cNonce = randomId();

    state.accessTokens.set(accessToken, {
        configurationIds,
        cNonce,
        expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return {
        status: 200,
        body: {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 300,
            c_nonce: cNonce,
            c_nonce_expires_in: 300,
        },
    };
};

/* ---------------------------- /credential --------------------------------- */

const handleCredential = async (ctx: HandlerContext): Promise<HandlerResponse> => {
    const auth = ctx.headers['authorization'] ?? '';
    const accessToken = auth.replace(/^Bearer\s+/i, '');

    const token = ctx.state.accessTokens.get(accessToken);
    if (!token) return oauthError('invalid_token', 'access_token invalid');
    if (token.expiresAt < Date.now()) {
        return oauthError('invalid_token', 'access_token expired');
    }

    let body: Record<string, unknown>;
    try {
        body = JSON.parse(ctx.body);
    } catch {
        return oauthError('invalid_request', 'credential request body not JSON');
    }

    const format = body.format ?? 'jwt_vc_json';
    if (format !== 'jwt_vc_json') {
        return oauthError('unsupported_credential_format', `format=${String(format)}`);
    }

    const proof = body.proof as { proof_type?: string; jwt?: string } | undefined;
    if (!proof?.jwt || proof.proof_type !== 'jwt') {
        return oauthError('invalid_proof', 'jwt proof required');
    }

    // Extract holder subject from the proof JWT without verifying
    // signature (we're an in-process tester, not a production issuer).
    // In a real issuer this would be a full JWS verify against the
    // DID doc + c_nonce check.
    //
    // OID4VCI §7.2.1.1 binds the holder via the protected header's
    // `kid` (which points to a verification method under the holder's
    // DID). The payload `iss` is the client_id, and is omitted for
    // pre-auth anonymous flows. So prefer `kid`, fall back to `iss`.
    const holderSubject = extractHolderSubject(proof.jwt);
    if (!holderSubject) {
        return oauthError('invalid_proof', 'proof JWT missing iss / kid');
    }

    // Verify c_nonce echoes what we gave out at /token.
    const proofPayload = decodeJwtPayload(proof.jwt);
    if (proofPayload?.nonce !== token.cNonce) {
        return oauthError('invalid_proof', 'c_nonce mismatch');
    }

    const vcJwt = await signVcJwt(ctx.state, holderSubject, token.configurationIds[0]!);

    return {
        status: 200,
        body: {
            credential: vcJwt,
            c_nonce: token.cNonce,
            c_nonce_expires_in: 300,
        },
    };
};

const signVcJwt = async (
    state: IssuerState,
    holder: string,
    _configurationId: string
): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const jti = `urn:uuid:${randomUuid()}`;

    const vc = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id: jti,
        type: ['VerifiableCredential', 'UniversityDegree'],
        issuer: { id: state.did },
        issuanceDate: new Date(now * 1000).toISOString(),
        credentialSubject: {
            id: holder,
            degree: { type: 'BachelorDegree', name: 'Bachelor of Science' },
        },
    };

    return new SignJWT({ vc })
        .setProtectedHeader({ alg: 'EdDSA', kid: state.kid, typ: 'JWT' })
        .setIssuer(state.did)
        .setSubject(holder)
        .setIssuedAt(now)
        .setJti(jti)
        .setExpirationTime(now + 365 * 24 * 60 * 60)
        .sign(state.privateKey);
};

/* -------------------------- /authorize + callback ------------------------- */

/**
 * Minimal `authorization_endpoint`. The wallet redirects the
 * user-agent here with `response_type=code` + PKCE; we short-circuit
 * the user-consent step and bounce straight back to the wallet's
 * `redirect_uri` with a fresh authorization code.
 *
 * The plugin's auth-code harness wires this by checking the 302
 * `Location` header for the `code` param, then POSTing to /token.
 */
const handleAuthorize = (ctx: HandlerContext): HandlerResponse => {
    const q = ctx.query;

    if (q.get('response_type') !== 'code') {
        return oauthError('unsupported_response_type', 'only response_type=code');
    }

    const codeChallenge = q.get('code_challenge');
    const codeChallengeMethod =
        (q.get('code_challenge_method') as 'S256' | 'plain' | null) ?? 'S256';
    const redirectUri = q.get('redirect_uri');
    const state = q.get('state') ?? undefined;
    const issuerState = q.get('issuer_state') ?? undefined;

    if (!codeChallenge || !redirectUri) {
        return oauthError('invalid_request', 'PKCE + redirect_uri required');
    }

    const configurationIds = issuerState
        ? ctx.state.offers.get(issuerState)?.credential_configuration_ids
        : undefined;

    if (!configurationIds) {
        return oauthError('invalid_request', 'issuer_state did not match a stored offer');
    }

    const code = randomId();

    ctx.state.authCodes.set(code, {
        configurationIds,
        codeChallenge,
        codeChallengeMethod,
        redirectUri,
    });

    // Build the callback URL the wallet receives.
    const callback = new URL(redirectUri);
    callback.searchParams.set('code', code);
    if (state) callback.searchParams.set('state', state);

    return {
        status: 302,
        body: { location: callback.toString() },
    };
};

/* -------------------------------------------------------------------------- */
/*                                 utilities                                  */
/* -------------------------------------------------------------------------- */

const oauthError = (error: string, description: string): HandlerResponse => ({
    status: 400,
    body: { error, error_description: description },
});

/**
 * Derive the holder's subject identifier from an OID4VCI proof JWT.
 *
 * OID4VCI §7.2.1.1 says the proof JWT MUST carry the holder's
 * verification method in the protected header's `kid`. The payload
 * `iss` is the client_id, which is absent for pre-auth anonymous
 * flows. So we prefer `kid` (stripping the fragment to get the bare
 * DID) and fall back to `iss` for flows that carry a client_id.
 */
const extractHolderSubject = (jwt: string): string | undefined => {
    const [headerB64, payloadB64] = jwt.split('.');

    try {
        const header = JSON.parse(b64urlToUtf8(headerB64!));
        if (typeof header.kid === 'string' && header.kid.length > 0) {
            // `did:jwk:xxx#0` → `did:jwk:xxx`
            const hashIdx = header.kid.indexOf('#');
            return hashIdx === -1 ? header.kid : header.kid.slice(0, hashIdx);
        }
    } catch {
        // fall through to iss
    }

    try {
        const payload = JSON.parse(b64urlToUtf8(payloadB64!));
        return typeof payload.iss === 'string' ? payload.iss : undefined;
    } catch {
        return undefined;
    }
};

const decodeJwtPayload = (jwt: string): Record<string, unknown> | undefined => {
    const [, payloadB64] = jwt.split('.');
    try {
        return JSON.parse(b64urlToUtf8(payloadB64!));
    } catch {
        return undefined;
    }
};

const verifyPkce = async (
    verifier: string,
    challenge: string,
    method: 'S256' | 'plain'
): Promise<boolean> => {
    if (method === 'plain') return verifier === challenge;
    const { subtle } = await import('node:crypto');
    const digest = await subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const computed = Buffer.from(digest)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return computed === challenge;
};

const toB64url = (s: string): string =>
    Buffer.from(s)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

const b64urlToUtf8 = (s: string): string => {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
};

const randomId = (): string => {
    const { randomBytes } = require('node:crypto') as typeof import('node:crypto');
    return randomBytes(16).toString('hex');
};

const randomUuid = (): string => {
    const { randomUUID } = require('node:crypto') as typeof import('node:crypto');
    return randomUUID();
};
