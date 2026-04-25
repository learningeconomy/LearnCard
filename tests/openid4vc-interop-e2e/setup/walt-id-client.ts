/**
 * Tiny admin-API client for the walt.id issuer + verifier services.
 *
 * The tests use this to set up scenarios (mint an offer, create a
 * verify session, poll status) the same way a real relying-party
 * backend would — then hand the resulting URI to our plugin to drive
 * the wallet-side flow.
 *
 * Two jobs it handles that a vanilla fetch wrapper wouldn't:
 *
 *  1. **Issuer keying** — walt.id's issuer API is deliberately
 *     stateless for keys; every POST to `/openid4vc/jwt/issue` must
 *     carry the issuer's signing key + DID. We generate a fresh
 *     Ed25519 keypair per run so tests don't collide with each other
 *     and so credential signatures are genuinely independent.
 *
 *  2. **By-value rewriting** — walt.id emits offers with a
 *     `credential_offer_uri` pointing at `http://localhost:7002/...`.
 *     Our plugin's parser mandates `https://` on that parameter
 *     (rightly — a pre-auth code traveling through an insecure URI
 *     is a credential leak). To keep the tests realistic without
 *     introducing a TLS proxy, we resolve the reference ourselves
 *     and hand the plugin a by-value `credential_offer=<json>` URI,
 *     which exercises the same downstream codepaths.
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
 * Generate an Ed25519 signing key wrapped as a walt.id–shaped JWK
 * plus a matching `did:jwk:<b64url(publicJwk)>` identifier.
 *
 * walt.id expects the `d` (private scalar) + `x` (public x-coord)
 * fields present in JWK. `jose.exportJWK` gives us exactly that.
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

    // did:jwk embeds the *public* JWK.
    const did = `did:jwk:${b64url(
        JSON.stringify({ kty: pubJwk.kty, crv: pubJwk.crv, x: pubJwk.x })
    )}`;

    return {
        jwk: {
            ...privJwk,
            kid,
        } as WaltidIssuerKey['jwk'],
        did,
    };
};

/* -------------------------------------------------------------------------- */
/*                              issuer admin API                              */
/* -------------------------------------------------------------------------- */

export interface MintOfferOptions {
    issuerBaseUrl: string;
    issuerKey: WaltidIssuerKey;
    /**
     * walt.id credential configuration id. The bundled default
     * catalogue includes `UniversityDegree_jwt_vc_json` out of the
     * box, which keeps the spec happy without needing a config mount.
     */
    credentialConfigurationId?: string;
    credentialSubjectId?: string;
}

/**
 * POST `/openid4vc/jwt/issue`. walt.id responds with the raw offer
 * URI in `text/plain`, e.g.
 *   `openid-credential-offer://?credential_offer_uri=...`
 */
export const mintWaltidOffer = async (
    opts: MintOfferOptions
): Promise<string> => {
    const {
        issuerBaseUrl,
        issuerKey,
        credentialConfigurationId = 'UniversityDegree_jwt_vc_json',
        credentialSubjectId,
    } = opts;

    const body = {
        issuerKey: { type: 'jwk', jwk: issuerKey.jwk },
        issuerDid: issuerKey.did,
        credentialConfigurationId,
        credentialData: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://www.w3.org/2018/credentials/examples/v1',
            ],
            id: `urn:uuid:${crypto.randomUUID()}`,
            type: ['VerifiableCredential', 'UniversityDegree'],
            issuer: { id: issuerKey.did },
            issuanceDate: new Date().toISOString(),
            credentialSubject: {
                id: credentialSubjectId ?? 'did:example:placeholder-replaced-by-holder',
                degree: {
                    type: 'BachelorDegree',
                    name: 'Bachelor of Science and Arts',
                },
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
    /**
     * Shape of each entry: `{ type: 'UniversityDegree', format: 'jwt_vc_json' }`.
     * See the walt.id docs for SD-JWT VC / mdoc variants.
     */
    requestCredentials: Array<Record<string, unknown>>;
    /** Seed the session's `state` so tests can correlate later. */
    stateId?: string;
}

export interface VerifySession {
    /** The `state` walt.id uses internally (echoes `stateId` if provided). */
    state: string;
    /** Full authorization request URI, e.g. `openid4vp://authorize?...` */
    authorizationRequestUri: string;
}

/**
 * POST `/openid4vc/verify`. Response body is the auth-request URI
 * as plaintext; the URL's `state` query param is what you later
 * pass to `/openid4vc/session/:state` to poll results.
 */
export const createWaltidVerifySession = async (
    opts: CreateVerifySessionOptions
): Promise<VerifySession> => {
    const { verifierBaseUrl, requestCredentials, stateId } = opts;

    const res = await fetch(`${verifierBaseUrl}/openid4vc/verify`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: '*/*',
            authorizeBaseUrl: 'openid4vp://authorize',
            responseMode: 'direct_post',
            ...(stateId ? { stateId } : {}),
        },
        body: JSON.stringify({ request_credentials: requestCredentials }),
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
    /** `null` if the wallet hasn't presented yet. */
    verificationResult: boolean | null;
    /** Raw body returned by walt.id — useful for assertion + debug logs. */
    raw: unknown;
}

/**
 * Poll `GET /openid4vc/session/:state` for verification status.
 *
 * Returns `{ verificationResult: null, raw: {...} }` until the wallet
 * has completed the `direct_post` round trip; once walt.id has
 * verified the VP the field flips to a boolean.
 */
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

/**
 * Poll until verification status flips to a definitive boolean, or
 * the timeout elapses. Keep intervals short — once the plugin has
 * POSTed its presentation walt.id resolves the session inside a
 * few hundred ms.
 */
export const waitForVerifyResult = async (
    verifierBaseUrl: string,
    state: string,
    timeoutMs = 15_000,
    intervalMs = 200
): Promise<WaltidVerifyStatus> => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const status = await getWaltidVerifyStatus(verifierBaseUrl, state);
        if (status.verificationResult !== null) return status;
        await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error(
        `walt.id verification status for state=${state} did not resolve within ${timeoutMs}ms`
    );
};

/* -------------------------------------------------------------------------- */
/*                            by-reference → by-value                         */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a `credential_offer_uri` to by-value offer JSON and
 * repackage as `openid-credential-offer://?credential_offer=<json>`.
 *
 * Pass-through when the input is already by-value.
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
 * `presentation_definition=<json>` query param. Acts as a no-op when
 * the input is already by-value. Preserves every other query param.
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
