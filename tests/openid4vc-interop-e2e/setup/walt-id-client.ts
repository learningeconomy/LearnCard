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

export type WaltidAuthenticationMethod = 'PRE_AUTHORIZED' | 'NONE';

export interface MintOfferOptions {
    issuerBaseUrl: string;
    issuerKey: WaltidIssuerKey;
    /**
     * walt.id credential configuration id. The bundled default
     * catalogue includes `UniversityDegree_jwt_vc_json` out of the
     * box, which keeps the spec happy without needing a config mount.
     */
    credentialConfigurationId?: string;
    /**
     * Concrete credential type name appended to the `type` array
     * after the spec-mandatory `VerifiableCredential` value. Defaults
     * to `UniversityDegree`. Tests issuing multiple credentials in
     * the same suite override this so the resulting VCs have
     * distinct shapes (and the verifier can target them
     * independently via PD type filters).
     */
    credentialType?: string;
    /**
     * Subject claims merged into `credentialSubject`. The `id` field
     * is auto-set by walt.id from the holder's proof JWT, so callers
     * only need to specify the actual claim payload.
     */
    subjectClaims?: Record<string, unknown>;
    credentialSubjectId?: string;
    /**
     * `PRE_AUTHORIZED` (default) → offer carries a pre-authorized
     * code grant. `NONE` → offer carries an `authorization_code`
     * grant where walt.id issues the code without challenging the
     * user, suitable for headless interop testing of Slice 4.
     */
    authenticationMethod?: WaltidAuthenticationMethod;
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
        credentialType = 'UniversityDegree',
        credentialSubjectId,
        subjectClaims,
        authenticationMethod = 'PRE_AUTHORIZED',
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
/*                       auth_code flow simulation helper                     */
/* -------------------------------------------------------------------------- */

export interface FollowAuthorizeResult {
    /** Authorization code echoed by walt.id on the redirect URL. */
    code: string;
    /** State echoed by walt.id — the wallet must validate this. */
    state?: string;
    /** Full Location URL walt.id wanted us to redirect the browser to. */
    redirectLocation: string;
}

/**
 * Simulate the user-agent half of an auth_code flow.
 *
 * In a real wallet, the user opens `authorizationUrl` in a browser
 * that walks any login screens, then the AS issues a 302 to the
 * wallet's `redirect_uri` with `?code=…&state=…`. For a headless
 * interop test, we fetch `authorizationUrl` with redirect-following
 * disabled and pull `code` + `state` straight off the `Location`
 * header. Requires walt.id's offer to have been minted with
 * `authenticationMethod: 'NONE'` so no login wall sits in the path.
 */
export const followWaltidAuthorize = async (
    authorizationUrl: string
): Promise<FollowAuthorizeResult> => {
    const res = await fetch(authorizationUrl, { redirect: 'manual' });

    // walt.id replies with a 3xx (typically 302) carrying the redirect URL.
    if (res.status < 300 || res.status >= 400) {
        throw new Error(
            `walt.id /authorize did not redirect (status ${res.status}, body ${await res
                .text()
                .catch(() => '<unreadable>')}). ` +
                'Make sure the offer was minted with authenticationMethod="NONE".'
        );
    }

    const location = res.headers.get('location');
    if (!location) {
        throw new Error(
            `walt.id /authorize redirected (status ${res.status}) but emitted no Location header`
        );
    }

    // The Location may be relative — resolve against the request URL.
    const resolved = new URL(location, authorizationUrl);
    const code = resolved.searchParams.get('code');
    const state = resolved.searchParams.get('state') ?? undefined;

    if (!code) {
        throw new Error(
            `walt.id /authorize redirect URL has no \`code\` param: ${resolved.toString()}`
        );
    }

    return { code, state, redirectLocation: resolved.toString() };
};

/* -------------------------------------------------------------------------- */
/*                              JWT tamper helper                             */
/* -------------------------------------------------------------------------- */

/**
 * Flip the trailing byte of a JWT's signature, producing a token
 * with a syntactically-valid shape but a signature that will fail
 * verification. Used in negative interop tests to confirm that
 * walt.id's verifier actually validates the inner VC signature, not
 * just the outer VP envelope.
 *
 * We mutate the signature rather than the header or payload because
 * those latter mutations can also blow up at JSON parse time, which
 * is a less interesting failure mode — we want walt.id to *attempt*
 * to verify and *correctly reject* on signature mismatch.
 */
export const tamperJwtSignature = (jwt: string): string => {
    const parts = jwt.split('.');
    if (parts.length !== 3) {
        throw new Error(`Not a 3-part JWT: ${jwt.slice(0, 40)}…`);
    }

    const sig = parts[2]!;
    if (sig.length < 4) throw new Error('JWT signature is too short to tamper');

    // Flip a base64url character roughly mid-signature so we always
    // mutate REAL signature bytes, not padding bits.
    //
    // Subtle gotcha — the obvious "flip the last char" approach is
    // unreliable for Ed25519 sigs: 64 bytes encode to 86 base64url
    // chars where the LAST char's bottom 2 bits are padding zeros.
    // When that last char is 'A' (value 0), flipping it to 'B'
    // (value 1) toggles ONLY a padding bit; the decoded signature
    // bytes are identical, the JWT still verifies, and the test
    // intermittently passes. By targeting a middle character we hit
    // a position whose 6 bits all carry real signature data, so any
    // flip guarantees a different byte sequence.
    const idx = Math.floor(sig.length / 2);
    const orig = sig[idx]!;
    // 'A' (0) and 'B' (1) are both alphabet members; pick the one
    // that's actually different from `orig`.
    const flipped = orig === 'A' ? 'B' : 'A';
    const tamperedSig = sig.slice(0, idx) + flipped + sig.slice(idx + 1);

    return [parts[0], parts[1], tamperedSig].join('.');
};

/* -------------------------------------------------------------------------- */

const extractSearchParams = (uri: string): URLSearchParams => {
    const qIdx = uri.indexOf('?');
    return new URLSearchParams(qIdx === -1 ? '' : uri.slice(qIdx + 1));
};

const extractParam = (uri: string, name: string): string | undefined =>
    extractSearchParams(uri).get(name) ?? undefined;
