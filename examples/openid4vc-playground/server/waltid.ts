/**
 * Server-side walt.id admin client used by the playground middleware.
 *
 * This is a curated lift of the helpers proven by the interop test
 * suite at `tests/openid4vc-interop-e2e/setup/walt-id-client.ts`. The
 * playground only depends on the surface a UI scenario actually
 * needs (mint offer, create verify session, poll status), plus a few
 * by-reference \u2192 by-value conveniences so the playground can serve
 * URIs the LearnCard wallet will accept (the wallet's parser
 * mandates `https://` on `credential_offer_uri`, but walt.id Docker
 * emits `http://localhost:7002/...`).
 *
 * Only imported from `server/api.ts` \u2014 never bundled into the
 * browser. `Buffer` and `jose` server APIs would not work there.
 */
import { exportJWK, generateKeyPair } from 'jose';
import type { JWK } from 'jose';

export interface WaltidIssuerKey {
    jwk: JWK & { d: string; x: string; kid: string; crv: 'Ed25519'; kty: 'OKP' };
    did: string;
}

const b64url = (input: string): string =>
    Buffer.from(input, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

/**
 * Generate an Ed25519 signing key wrapped as a walt.id-shaped JWK
 * plus a matching `did:jwk:<b64url(publicJwk)>` identifier. Each
 * scenario gets a fresh key so subsequent runs don't collide and
 * issued credentials can be tracked by issuer DID.
 */
export const createIssuerKey = async (): Promise<WaltidIssuerKey> => {
    const { privateKey, publicKey } = (await generateKeyPair('EdDSA', {
        crv: 'Ed25519',
        extractable: true,
    })) as { privateKey: CryptoKey; publicKey: CryptoKey };

    const privJwk = (await exportJWK(privateKey)) as JWK;
    const pubJwk = (await exportJWK(publicKey)) as JWK;

    if (privJwk.kty !== 'OKP' || privJwk.crv !== 'Ed25519') {
        throw new Error('Expected Ed25519 OKP keypair');
    }

    const kid = `kid-${Math.random().toString(36).slice(2, 10)}`;
    const did = `did:jwk:${b64url(
        JSON.stringify({ kty: pubJwk.kty, crv: pubJwk.crv, x: pubJwk.x })
    )}`;

    return {
        jwk: { ...privJwk, kid } as WaltidIssuerKey['jwk'],
        did,
    };
};

/* -------------------------------------------------------------------------- */
/*                              issuer admin API                              */
/* -------------------------------------------------------------------------- */

export type WaltidAuthenticationMethod = 'PRE_AUTHORIZED' | 'NONE';

export interface MintOfferOptions {
    issuerBaseUrl: string;
    issuerKey: WaltidIssuerKey;
    credentialConfigurationId?: string;
    credentialType?: string;
    subjectClaims?: Record<string, unknown>;
    credentialSubjectId?: string;
    /**
     * `PRE_AUTHORIZED` (default) \u2192 offer carries a pre-authorized
     * code grant. `NONE` \u2192 offer carries an `authorization_code`
     * grant where walt.id issues the code without challenging the
     * user (suitable for the auth-code scenario).
     */
    authenticationMethod?: WaltidAuthenticationMethod;
    /**
     * When set, walt.id issues the offer with `tx_code` enabled \u2014
     * the wallet will prompt for this PIN before exchanging the
     * pre-auth code. Used to exercise the LCA PIN modal.
     */
    txCode?: string;
}

/**
 * POST `/openid4vc/jwt/issue` and return the raw offer URI.
 * walt.id replies with `text/plain` containing
 * `openid-credential-offer://?credential_offer_uri=...`.
 */
export const mintWaltidOffer = async (
    opts: MintOfferOptions
): Promise<string> => {
    const {
        issuerBaseUrl,
        issuerKey,
        credentialConfigurationId = 'UniversityDegree_jwt_vc_json',
        credentialType = 'UniversityDegree',
        credentialSubjectId,
        subjectClaims,
        authenticationMethod = 'PRE_AUTHORIZED',
        txCode,
    } = opts;

    const body: Record<string, unknown> = {
        issuerKey: { type: 'jwk', jwk: issuerKey.jwk },
        issuerDid: issuerKey.did,
        credentialConfigurationId,
        credentialData: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1',
            ],
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['VerifiableCredential', credentialType],
            issuer: { id: issuerKey.did },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: credentialSubjectId ?? 'did:example:placeholder-replaced-by-holder',
                ...(subjectClaims ?? {
                    degree: {
                        type: 'BachelorDegree',
                        name: 'Bachelor of Science and Arts',
                    },
                }),
            },
        },
        mapping: {
            id: '<uuid>',
            issuer: { id: '<issuerDid>' },
            credentialSubject: { id: '<subjectDid>' },
            issuanceDate: '<timestamp>',
            expirationDate: '<timestamp-in:365d>',
        },
        authenticationMethod,
        standardVersion: 'DRAFT13',
    };

    if (txCode) {
        // walt.id reads `tx_code` (the spec's own field name) off the
        // top level of the issuance request payload to enable PIN
        // gating on the resulting offer.
        body.txCode = txCode;
    }

    const res = await fetch(`${issuerBaseUrl}/openid4vc/jwt/issue`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/plain' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            `walt.id issuer /openid4vc/jwt/issue failed ${res.status}: ${await res.text()}`
        );
    }

    const offerUri = (await res.text()).trim();
    if (!offerUri.includes('credential_offer')) {
        throw new Error(`walt.id issuer returned unexpected offer URI: ${offerUri}`);
    }

    return offerUri;
};

/* -------------------------------------------------------------------------- */
/*                             verifier admin API                             */
/* -------------------------------------------------------------------------- */

export interface CreateVerifySessionOptions {
    verifierBaseUrl: string;
    /** Per-credential request shape, e.g. `{ type: 'UniversityDegree', format: 'jwt_vc_json' }` */
    requestCredentials: Array<Record<string, unknown>>;
    stateId?: string;
    /**
     * Override default `direct_post`. Set to `'direct_post.jwt'` for
     * the JARM scenario \u2014 walt.id wraps the response object in a
     * JWE the wallet must encrypt to the verifier's key.
     */
    responseMode?: string;
    /**
     * Inline DCQL query passed via the spec's `dcql_query` parameter.
     * walt.id supports DCQL alongside its native PEX shape; when set,
     * `requestCredentials` is ignored and the verifier emits a DCQL
     * authorization request instead.
     */
    dcqlQuery?: Record<string, unknown>;
    /** Optional inline presentation_definition override. */
    presentationDefinition?: Record<string, unknown>;
}

export interface VerifySession {
    state: string;
    authorizationRequestUri: string;
}

export const createWaltidVerifySession = async (
    opts: CreateVerifySessionOptions
): Promise<VerifySession> => {
    const {
        verifierBaseUrl,
        requestCredentials,
        stateId,
        responseMode = 'direct_post',
        dcqlQuery,
        presentationDefinition,
    } = opts;

    const headers: Record<string, string> = {
        'content-type': 'application/json',
        accept: '*/*',
        // walt.id uses request HEADERS (not body) to override the
        // outer authorize URL scheme + response_mode + state seed.
        // Yes, it is unusual; this is what the verifier expects.
        authorizeBaseUrl: 'openid4vp://authorize',
        responseMode,
    };
    if (stateId) headers.stateId = stateId;

    const body: Record<string, unknown> = {};
    if (dcqlQuery) {
        body.dcql_query = dcqlQuery;
    } else if (presentationDefinition) {
        body.presentation_definition = presentationDefinition;
    } else {
        body.request_credentials = requestCredentials;
    }

    const res = await fetch(`${verifierBaseUrl}/openid4vc/verify`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            `walt.id verifier /openid4vc/verify failed ${res.status}: ${await res.text()}`
        );
    }

    const authorizationRequestUri = (await res.text()).trim();
    const state = extractParam(authorizationRequestUri, 'state');

    if (!state) {
        throw new Error(
            `walt.id verifier returned URI with no state param: ${authorizationRequestUri}`
        );
    }

    return { state, authorizationRequestUri };
};

export interface WaltidVerifyStatus {
    /** `null` until the wallet has POSTed its presentation. */
    verificationResult: boolean | null;
    raw: unknown;
}

export const getWaltidVerifyStatus = async (
    verifierBaseUrl: string,
    state: string
): Promise<WaltidVerifyStatus> => {
    const res = await fetch(`${verifierBaseUrl}/openid4vc/session/${state}`);

    if (!res.ok) {
        throw new Error(
            `walt.id verifier /openid4vc/session/${state} failed ${res.status}: ${await res.text()}`
        );
    }

    const raw = await res.json();
    const result = (raw as { verificationResult?: boolean | null }).verificationResult;

    return {
        verificationResult: typeof result === 'boolean' ? result : null,
        raw,
    };
};

/* -------------------------------------------------------------------------- */
/*                            by-reference \u2192 by-value                          */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a `credential_offer_uri` to by-value offer JSON and
 * repackage as `openid-credential-offer://?credential_offer=<json>`.
 * Pass-through when the input is already by-value.
 *
 * Why we always do this in the playground: the LCA wallet's parser
 * mandates `https://` on `credential_offer_uri` (a pre-auth code
 * over plain HTTP would be a credential leak). walt.id Docker
 * emits `http://localhost:7002/...`, which the wallet rejects.
 * Resolving + inlining sidesteps the constraint without weakening
 * production code.
 */
export const resolveOfferToByValue = async (offerUri: string): Promise<string> => {
    const params = extractSearchParams(offerUri);
    if (params.get('credential_offer')) return offerUri;

    const byRef = params.get('credential_offer_uri');
    if (!byRef) throw new Error(`Offer URI has no credential_offer[_uri]: ${offerUri}`);

    const res = await fetch(byRef);
    if (!res.ok) {
        throw new Error(
            `Failed to resolve credential_offer_uri ${byRef}: HTTP ${res.status}`
        );
    }

    const offerJson = await res.json();
    return (
        'openid-credential-offer://?credential_offer=' +
        encodeURIComponent(JSON.stringify(offerJson))
    );
};

/**
 * Resolve a `presentation_definition_uri` to an inline
 * `presentation_definition=<json>` query param. Same rationale as
 * the offer-side helper \u2014 walt.id emits http:// references the
 * wallet won't fetch.
 */
export const resolveAuthorizationRequestToByValue = async (
    authRequestUri: string
): Promise<string> => {
    const queryStart = authRequestUri.indexOf('?');
    if (queryStart === -1) return authRequestUri;

    const base = authRequestUri.slice(0, queryStart);
    const params = new URLSearchParams(authRequestUri.slice(queryStart + 1));

    if (params.get('presentation_definition')) return authRequestUri;

    const pdUri = params.get('presentation_definition_uri');
    if (!pdUri) return authRequestUri;

    const res = await fetch(pdUri);
    if (!res.ok) {
        throw new Error(
            `Failed to resolve presentation_definition_uri ${pdUri}: HTTP ${res.status}`
        );
    }

    const pd = await res.json();
    params.delete('presentation_definition_uri');
    params.set('presentation_definition', JSON.stringify(pd));

    return `${base}?${params.toString()}`;
};

/* -------------------------------------------------------------------------- */

const extractSearchParams = (uri: string): URLSearchParams => {
    const qIdx = uri.indexOf('?');
    return new URLSearchParams(qIdx === -1 ? '' : uri.slice(qIdx + 1));
};

const extractParam = (uri: string, name: string): string | undefined =>
    extractSearchParams(uri).get(name) ?? undefined;
