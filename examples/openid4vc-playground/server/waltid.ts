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
     * grant where walt.id issues the code without challenging the
     * user (suitable for the auth-code scenario).
     */
    authenticationMethod?: WaltidAuthenticationMethod;
    /**
     * When set, we post-process the offer JSON after walt.id returns
     * it to inject a `tx_code` descriptor into the pre-authorized_code
     * grant. The LCA wallet triggers its PIN modal on the presence of
     * that field, sends the PIN with the token request, and walt.id
     * ignores the unexpected field in the form body — so the full
     * wallet UX runs end-to-end, but the PIN itself is never actually
     * verified (walt.id's community issuer-api has no PIN support).
     *
     * We do NOT send `txCode` on the issuance request itself: walt.id's
     * `IssuanceRequest` schema (kotlinx-serialization, strict mode)
     * rejects every unknown field with HTTP 406. Confirmed empirically
     * against `waltid/issuer-api:latest` and in the Kotlin source
     * (`id/walt/issuer/issuance/IssuanceRequests.kt`). The PIN-capable
     * `NewIssuanceRequest` type exists in the codebase but isn't wired
     * to any route.
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

    // Wallet-side PIN simulation. See the `txCode` docstring on
    // {@link MintOfferOptions} for why we don't pass it to walt.id.
    if (txCode) {
        return await injectTxCodeIntoOffer(offerUri, txCode);
    }

    return offerUri;
};

/**
 * Resolve the offer to by-value JSON, inject a `tx_code` descriptor
 * into the pre-authorized_code grant, and repackage. The wallet will
 * prompt for the PIN on seeing this field (per OID4VCI Draft 13 §4.1.1)
 * and include it in the subsequent token request — even though walt.id
 * never set PIN gating up and silently accepts any value.
 *
 * The PIN is embedded in the `description` so the playground UI can
 * surface it to the dev ("Enter the PIN: 1234") without a separate
 * out-of-band channel.
 */
const injectTxCodeIntoOffer = async (
    offerUri: string,
    pin: string
): Promise<string> => {
    const params = extractSearchParams(offerUri);

    let offerJson: Record<string, unknown>;
    const byValue = params.get('credential_offer');
    const byRef = params.get('credential_offer_uri');

    if (byValue) {
        offerJson = JSON.parse(byValue);
    } else if (byRef) {
        const res = await fetch(byRef);
        if (!res.ok) {
            throw new Error(
                `Failed to resolve credential_offer_uri ${byRef} for PIN injection: HTTP ${res.status}`
            );
        }
        offerJson = (await res.json()) as Record<string, unknown>;
    } else {
        throw new Error(`Offer URI has no credential_offer[_uri]: ${offerUri}`);
    }

    const grants = (offerJson.grants ?? {}) as Record<string, Record<string, unknown>>;
    const preAuthKey = 'urn:ietf:params:oauth:grant-type:pre-authorized_code';
    const preAuthGrant = grants[preAuthKey];

    if (!preAuthGrant) {
        throw new Error(
            `Offer has no pre-authorized_code grant — cannot simulate PIN gating (grants: ${Object.keys(
                grants
            ).join(', ') || 'none'})`
        );
    }

    preAuthGrant.tx_code = {
        input_mode: 'numeric',
        length: pin.length,
        description: `Enter the PIN (hint: ${pin})`,
    };

    return (
        'openid-credential-offer://?credential_offer=' +
        encodeURIComponent(JSON.stringify(offerJson))
    );
};

/* -------------------------------------------------------------------------- */
/*                              SD-JWT VC issuance                            */
/* -------------------------------------------------------------------------- */

export interface MintSdJwtOfferOptions {
    issuerBaseUrl: string;
    issuerKey: WaltidIssuerKey;
    /**
     * Walt.id config id from `/.well-known/openid-credential-issuer`.
     * Defaults to `UniversityDegree_vc+sd-jwt`, which is shipped in
     * the bundled credential registry of `waltid/issuer-api:latest`.
     */
    credentialConfigurationId?: string;
    /**
     * The `vct` (Verifiable Credential Type) URL the issuer assigns
     * to this credential. Must match the `vct` declared in the
     * issuer's metadata for `credentialConfigurationId`. Defaults
     * matching the bundled registry's `UniversityDegree_vc+sd-jwt`.
     */
    vct?: string;
    /** Subject claims to embed (will be selectively-disclosable). */
    subjectClaims?: Record<string, unknown>;
}

/**
 * POST `/openid4vc/sdjwt/issue` to mint an SD-JWT VC offer.
 *
 * Walt.id's SD-JWT route shares the {@link IssuanceRequest} schema
 * with the JWT route — same body shape — but the `vct` field becomes
 * required (it's the SD-JWT VC type identifier the wallet looks up
 * in `/.well-known/vct/<type>` for type metadata).
 */
export const mintWaltidSdJwtOffer = async (
    opts: MintSdJwtOfferOptions
): Promise<string> => {
    const {
        issuerBaseUrl,
        issuerKey,
        credentialConfigurationId = 'UniversityDegree_vc+sd-jwt',
        vct = `${issuerBaseUrl}/draft13/UniversityDegree`,
        subjectClaims,
    } = opts;

    const body = {
        issuerKey: { type: 'jwk', jwk: issuerKey.jwk },
        issuerDid: issuerKey.did,
        credentialConfigurationId,
        vct,
        credentialData: {
            // SD-JWT VCs don't strictly require the VCDM context, but
            // walt.id's bundled mapping pipeline expects W3C-shaped
            // input it can transform into the SD-JWT payload.
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1',
            ],
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['VerifiableCredential', 'UniversityDegree'],
            issuer: { id: issuerKey.did },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'did:example:placeholder-replaced-by-holder',
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
        authenticationMethod: 'PRE_AUTHORIZED',
        standardVersion: 'DRAFT13',
    };

    const res = await fetch(`${issuerBaseUrl}/openid4vc/sdjwt/issue`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/plain' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            `walt.id issuer /openid4vc/sdjwt/issue failed ${res.status}: ${await res.text()}`
        );
    }

    const offerUri = (await res.text()).trim();
    if (!offerUri.includes('credential_offer')) {
        throw new Error(`walt.id issuer returned unexpected offer URI: ${offerUri}`);
    }
    return offerUri;
};

/* -------------------------------------------------------------------------- */
/*                         Batch JWT VC issuance                              */
/* -------------------------------------------------------------------------- */

export interface MintBatchOfferOptions {
    issuerBaseUrl: string;
    issuerKey: WaltidIssuerKey;
    /**
     * One entry per credential to mint into the same offer. Each
     * entry's `credentialConfigurationId` must exist in the issuer's
     * metadata. Wallet receives all of them as `credential_configuration_ids`
     * on a single offer and runs one credential request per id.
     */
    credentials: Array<{
        credentialConfigurationId: string;
        credentialType: string;
        subjectClaims?: Record<string, unknown>;
    }>;
}

/**
 * POST `/openid4vc/jwt/issueBatch` with an array of {@link IssuanceRequest}
 * bodies. Walt.id bundles them into a single pre-auth offer whose
 * `credential_configuration_ids` lists every credential — the wallet
 * loops over the ids, issues one POP JWT per request, and stores
 * each returned credential. Exercises the wallet's batched-issuance
 * path that the single-offer scenarios don't touch.
 */
export const mintWaltidBatchOffer = async (
    opts: MintBatchOfferOptions
): Promise<string> => {
    const { issuerBaseUrl, issuerKey, credentials } = opts;

    if (credentials.length < 2) {
        throw new Error(
            `mintWaltidBatchOffer requires at least 2 credentials (got ${credentials.length})`
        );
    }

    const body = credentials.map(c => ({
        issuerKey: { type: 'jwk', jwk: issuerKey.jwk },
        issuerDid: issuerKey.did,
        credentialConfigurationId: c.credentialConfigurationId,
        credentialData: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1',
            ],
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['VerifiableCredential', c.credentialType],
            issuer: { id: issuerKey.did },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: 'did:example:placeholder-replaced-by-holder',
                ...(c.subjectClaims ?? {}),
            },
        },
        mapping: {
            id: '<uuid>',
            issuer: { id: '<issuerDid>' },
            credentialSubject: { id: '<subjectDid>' },
            issuanceDate: '<timestamp>',
            expirationDate: '<timestamp-in:365d>',
        },
        authenticationMethod: 'PRE_AUTHORIZED',
        standardVersion: 'DRAFT13',
    }));

    const res = await fetch(`${issuerBaseUrl}/openid4vc/jwt/issueBatch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'text/plain' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        throw new Error(
            `walt.id issuer /openid4vc/jwt/issueBatch failed ${res.status}: ${await res.text()}`
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

    // walt.id's verifier-api requires `request_credentials` to be
    // present on every request (its handler throws BadRequestException
    // otherwise), even when we override the resulting authorization
    // request with a custom `presentation_definition`. Send both: the
    // PD overrides what the wallet sees on the wire, but
    // `request_credentials` keeps walt.id's deserializer happy.
    const body: Record<string, unknown> = {
        request_credentials: requestCredentials,
    };
    if (dcqlQuery) {
        // Note: walt.id's community verifier-api currently ignores
        // `dcql_query` entirely and falls back to PEX. Kept here for
        // forward-compat with future walt.id versions or other
        // vendors that share this client.
        body.dcql_query = dcqlQuery;
    }
    if (presentationDefinition) {
        body.presentation_definition = presentationDefinition;
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
 * Replace the verifier's auto-generated `presentation_definition`
 * with a caller-supplied one in the authorization request URI.
 *
 * walt.id's verifier-api community stack always derives the PD
 * from `request_credentials` and silently drops the body-level
 * `presentation_definition` override (we confirmed this empirically
 * \u2014 the field is read but the resulting auth request still carries
 * walt.id's auto-generated PD). Consequently, scenarios that need
 * specific PEX features (claims constraints, multi-descriptor,
 * fancier `format` filters) post-process the URI here.
 *
 * The PD goes inline as `presentation_definition=<json>`, so the
 * walletside HTTPS guard on `presentation_definition_uri` (same
 * one that bites `credential_offer_uri`) is sidestepped at the
 * same time.
 */
export const overridePresentationDefinition = (
    authRequestUri: string,
    customPd: Record<string, unknown>
): string => {
    const queryStart = authRequestUri.indexOf('?');
    if (queryStart === -1) {
        throw new Error(
            `Authorization request URI has no query string: ${authRequestUri}`
        );
    }
    const base = authRequestUri.slice(0, queryStart);
    const params = new URLSearchParams(authRequestUri.slice(queryStart + 1));

    params.delete('presentation_definition_uri');
    params.set('presentation_definition', JSON.stringify(customPd));

    return `${base}?${params.toString()}`;
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
