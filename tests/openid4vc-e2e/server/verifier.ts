/**
 * Minimum OpenID4VP Verifier for e2e tests.
 *
 * Implements enough of Draft 22 to drive the plugin's present-side
 * flow end-to-end:
 *   GET  /vp/pd/:id          (presentation_definition by reference)
 *   POST /vp/verify/:id      (direct_post receiver)
 *   POST /vp/sessions        (test admin: create a new verify session)
 *
 * Verifies inbound VP JWTs (jwt_vp_json) — importing the holder's
 * did:jwk public key from the `iss` claim — and checks audience +
 * nonce. For ldp_vp, accepts and structurally inspects the submitted
 * JSON but doesn't validate the LD proof (we don't haul didkit into a
 * test package).
 *
 * When `include_siop` is true on session creation, the verifier
 * additionally requires an `id_token` alongside `vp_token` per
 * SIOPv2 + OID4VP combined flow (Slice 8).
 */
import { compactDecrypt, exportJWK, generateKeyPair, importJWK, jwtVerify } from 'jose';
import type { JWK, KeyLike } from 'jose';

import type { HandlerContext, HandlerResponse } from './issuer';

/* -------------------------------------------------------------------------- */
/*                                 state                                      */
/* -------------------------------------------------------------------------- */

export interface VerifierState {
    origin: string;
    sessions: Map<string, VerifySession>;
}

interface VerifySession {
    id: string;
    clientId: string;
    nonce: string;
    state: string;
    responseUri: string;
    pdUri: string;
    authRequestUri: string;
    presentationDefinition: Record<string, unknown>;
    responseType: 'vp_token' | 'vp_token id_token';
    submissions: SubmissionRecord[];
    acceptedRedirect: string;
    /** Query language the session drives: PEX or OID4VP 1.0 DCQL. */
    queryKind: 'pex' | 'dcql';
    /** `direct_post` (cleartext) or `direct_post.jwt` (JARM-encrypted). */
    responseMode: 'direct_post' | 'direct_post.jwt';
    /** Verifier's private enc key for JARM (`direct_post.jwt`) sessions. */
    encPrivateKey?: KeyLike;
}

export interface SubmissionRecord {
    receivedAt: number;
    form: Record<string, string>;
    decodedVp?: { header: unknown; payload: unknown };
    decodedIdToken?: { header: unknown; payload: unknown };
    verifierAccepted: boolean;
    rejectionReason?: string;
}

export const createVerifierState = (origin: string): VerifierState => ({
    origin,
    sessions: new Map(),
});

/* -------------------------------------------------------------------------- */
/*                              admin helpers                                 */
/* -------------------------------------------------------------------------- */

/**
 * Test admin — spin up a new VP verification session and hand back the
 * authorization-request URI the wallet should consume.
 */
export const createSession = async (
    state: VerifierState,
    options: {
        /** PEX definition. Mutually exclusive with `dcqlQuery`. */
        presentationDefinition?: Record<string, unknown>;
        /** OID4VP 1.0 DCQL query. Mutually exclusive with `presentationDefinition`. */
        dcqlQuery?: Record<string, unknown>;
        includeSiop?: boolean;
        /** Request `direct_post.jwt` (JARM) with a 1.0 enc-values advertisement. */
        encryptResponse?: boolean;
        /** OID4VP 1.0 §5.1 transaction_data (base64url strings) to attach. */
        transactionData?: string[];
    }
): Promise<VerifySession> => {
    const id = randomId();
    const clientId = `${state.origin}/vp/client/${id}`;
    const nonce = randomId();
    const stateParam = randomId();

    const responseType: VerifySession['responseType'] = options.includeSiop
        ? 'vp_token id_token'
        : 'vp_token';

    const queryKind: VerifySession['queryKind'] = options.dcqlQuery ? 'dcql' : 'pex';
    const responseMode: VerifySession['responseMode'] = options.encryptResponse
        ? 'direct_post.jwt'
        : 'direct_post';

    const session: VerifySession = {
        id,
        clientId,
        nonce,
        state: stateParam,
        responseUri: `${state.origin}/vp/verify/${id}`,
        pdUri: `${state.origin}/vp/pd/${id}`,
        authRequestUri: '', // filled below
        presentationDefinition: options.presentationDefinition ?? {},
        responseType,
        submissions: [],
        acceptedRedirect: `${state.origin}/vp/success/${id}`,
        queryKind,
        responseMode,
    };

    // Authorization Request URI — fully by_value. We use
    // client_id_scheme=redirect_uri so no signed Request Object is
    // required, and we inline the query (not `_uri`) because the
    // plugin's by-reference resolvers mandate https:// and our
    // in-process test server runs on plain http://127.0.0.1.
    const params = new URLSearchParams({
        response_type: session.responseType,
        client_id: session.clientId,
        client_id_scheme: 'redirect_uri',
        response_mode: session.responseMode,
        response_uri: session.responseUri,
        nonce: session.nonce,
        state: session.state,
    });

    if (queryKind === 'dcql') {
        params.set('dcql_query', JSON.stringify(options.dcqlQuery));
    } else {
        params.set('presentation_definition', JSON.stringify(session.presentationDefinition));
    }

    if (options.transactionData && options.transactionData.length > 0) {
        params.set('transaction_data', JSON.stringify(options.transactionData));
    }

    // JARM: generate an ephemeral P-256 enc key and advertise it via
    // client_metadata using the OID4VP 1.0 field names — `jwks` for the
    // key and `encrypted_response_enc_values_supported` for the `enc`
    // list (this is what exercises the plugin's 1.0 negotiation path,
    // not the pre-1.0 `authorization_encrypted_response_*` fields).
    if (options.encryptResponse) {
        const { publicKey, privateKey } = await generateKeyPair('ECDH-ES', {
            crv: 'P-256',
            extractable: true,
        });
        const publicJwk = (await exportJWK(publicKey)) as JWK;
        publicJwk.use = 'enc';
        publicJwk.alg = 'ECDH-ES';
        publicJwk.kid = `verifier-enc-${id}`;
        session.encPrivateKey = privateKey;

        params.set(
            'client_metadata',
            JSON.stringify({
                jwks: { keys: [publicJwk] },
                encrypted_response_enc_values_supported: ['A128GCM'],
            })
        );
    }

    session.authRequestUri = `openid4vp://authorize?${params.toString()}`;

    state.sessions.set(id, session);

    return session;
};

/* -------------------------------------------------------------------------- */
/*                                handlers                                    */
/* -------------------------------------------------------------------------- */

export const handleVerifierRequest = async (
    ctx: HandlerContext & { verifier: VerifierState }
): Promise<HandlerResponse | null> => {
    const { method, path } = ctx;

    if (method === 'GET' && path.startsWith('/vp/pd/')) {
        const id = path.slice('/vp/pd/'.length);
        const session = ctx.verifier.sessions.get(id);
        if (!session) return { status: 404, body: { error: 'session_not_found' } };
        return { status: 200, body: session.presentationDefinition };
    }

    if (method === 'POST' && path.startsWith('/vp/verify/')) {
        const id = path.slice('/vp/verify/'.length);
        const session = ctx.verifier.sessions.get(id);
        if (!session) return { status: 404, body: { error: 'session_not_found' } };
        return handleVerify(ctx, session);
    }

    if (method === 'POST' && path === '/vp/sessions') {
        // Test admin endpoint — lets tests outside the test process
        // (if any) create sessions. Tests inside the process prefer
        // createSession() directly for the richer return shape.
        let body: Record<string, unknown>;
        try {
            body = JSON.parse(ctx.body);
        } catch {
            return { status: 400, body: { error: 'invalid_json' } };
        }

        const session = await createSession(ctx.verifier, {
            presentationDefinition:
                (body.presentation_definition as Record<string, unknown> | undefined) ?? {},
            includeSiop: Boolean(body.include_siop),
        });

        return { status: 200, body: sessionResponse(session) };
    }

    return null;
};

const sessionResponse = (session: VerifySession) => ({
    id: session.id,
    authorization_request_uri: session.authRequestUri,
    client_id: session.clientId,
    nonce: session.nonce,
    state: session.state,
});

/* ---------------------------- /vp/verify/:id ------------------------------ */

const handleVerify = async (
    ctx: HandlerContext & { verifier: VerifierState },
    session: VerifySession
): Promise<HandlerResponse> => {
    const rawForm = Object.fromEntries(new URLSearchParams(ctx.body).entries());

    const record: SubmissionRecord = {
        receivedAt: Date.now(),
        form: rawForm,
        verifierAccepted: false,
    };

    session.submissions.push(record);

    // For direct_post.jwt (JARM), the single `response` form field is a JWE
    // encrypted to the verifier's advertised key. Decrypt it and treat the
    // JSON payload as the response object; otherwise use the cleartext form.
    let response: Record<string, unknown>;
    if (session.responseMode === 'direct_post.jwt') {
        if (!rawForm.response || !session.encPrivateKey) {
            record.rejectionReason = 'expected encrypted `response` (direct_post.jwt)';
            return {
                status: 400,
                body: { error: 'invalid_request', error_description: record.rejectionReason },
            };
        }
        try {
            const { plaintext } = await compactDecrypt(rawForm.response, session.encPrivateKey);
            response = JSON.parse(new TextDecoder().decode(plaintext)) as Record<string, unknown>;
        } catch (e) {
            record.rejectionReason = `JARM decryption failed: ${describe(e)}`;
            return {
                status: 400,
                body: { error: 'invalid_request', error_description: record.rejectionReason },
            };
        }
    } else {
        response = rawForm;
    }

    const stateValue = response.state as string | undefined;
    const vpToken = response.vp_token;
    const idToken = response.id_token as string | undefined;

    // Echoed state cross-check.
    if (stateValue !== session.state) {
        record.rejectionReason = `state mismatch (got ${String(stateValue)}, expected ${
            session.state
        })`;
        return {
            status: 400,
            body: { error: 'invalid_state', error_description: record.rejectionReason },
        };
    }

    if (vpToken === undefined || vpToken === null) {
        record.rejectionReason = 'missing vp_token';
        return {
            status: 400,
            body: { error: 'invalid_request', error_description: record.rejectionReason },
        };
    }

    // OID4VP 1.0 §6.4: DCQL responses key vp_token by credential_query_id and
    // MUST NOT carry a presentation_submission. PEX responses are a single
    // presentation plus a presentation_submission.
    if (session.queryKind === 'dcql') {
        if (response.presentation_submission !== undefined) {
            record.rejectionReason =
                'DCQL response must not include presentation_submission (§6.4)';
            return {
                status: 400,
                body: { error: 'invalid_request', error_description: record.rejectionReason },
            };
        }
        try {
            record.decodedVp = await verifyDcqlVpToken(vpToken, {
                audience: session.clientId,
                nonce: session.nonce,
            });
        } catch (e) {
            record.rejectionReason = `DCQL vp_token verification failed: ${describe(e)}`;
            return {
                status: 400,
                body: { error: 'invalid_presentation', error_description: record.rejectionReason },
            };
        }
    } else {
        if (response.presentation_submission === undefined) {
            record.rejectionReason = 'missing presentation_submission (PEX)';
            return {
                status: 400,
                body: { error: 'invalid_request', error_description: record.rejectionReason },
            };
        }
        // SIOPv2 combined flow (Slice 8) — `id_token` must accompany the
        // vp_token when we asked for both in the Authorization Request.
        if (session.responseType === 'vp_token id_token' && !idToken) {
            record.rejectionReason = 'id_token required (SIOPv2 combined flow)';
            return {
                status: 400,
                body: { error: 'invalid_request', error_description: record.rejectionReason },
            };
        }
        try {
            record.decodedVp = await verifySinglePresentation(String(vpToken), session);
        } catch (e) {
            record.rejectionReason = `vp_token verification failed: ${describe(e)}`;
            return {
                status: 400,
                body: { error: 'invalid_presentation', error_description: record.rejectionReason },
            };
        }
    }

    // id_token: when present, must verify against holder's did:jwk and
    // carry the session nonce.
    if (idToken) {
        try {
            record.decodedIdToken = await verifyIdToken(idToken, {
                audience: session.clientId,
                nonce: session.nonce,
            });
        } catch (e) {
            record.rejectionReason = `id_token verification failed: ${describe(e)}`;
            return {
                status: 400,
                body: {
                    error: 'invalid_id_token',
                    error_description: record.rejectionReason,
                },
            };
        }
    }

    record.verifierAccepted = true;

    return {
        status: 200,
        body: { redirect_uri: session.acceptedRedirect },
    };
};

/* -------------------------- presentation checks --------------------------- */

/** PEX single presentation: compact JWT-VP, or a structurally-checked LDP-VP. */
const verifySinglePresentation = async (
    vpToken: string,
    session: VerifySession
): Promise<{ header: unknown; payload: unknown }> => {
    if (isCompactJws(vpToken)) {
        return verifyVpJwt(vpToken, { audience: session.clientId, nonce: session.nonce });
    }
    const ldpVp = JSON.parse(vpToken);
    if (
        !ldpVp ||
        typeof ldpVp !== 'object' ||
        !ldpVp.proof ||
        typeof ldpVp.proof.challenge !== 'string' ||
        ldpVp.proof.challenge !== session.nonce ||
        ldpVp.proof.domain !== session.clientId
    ) {
        throw new Error('ldp_vp proof domain/challenge do not match verifier session');
    }
    return { header: {}, payload: ldpVp };
};

/**
 * DCQL vp_token (§6.4): a JSON object keyed by credential_query_id whose
 * values are a presentation (string) or array of presentations. Verify each
 * as a JWT-VP against the session audience + nonce.
 */
const verifyDcqlVpToken = async (
    vpToken: unknown,
    ctx: { audience: string; nonce: string }
): Promise<{ header: unknown; payload: unknown }> => {
    const obj = typeof vpToken === 'string' ? JSON.parse(vpToken) : vpToken;
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error('DCQL vp_token must be a JSON object keyed by credential_query_id');
    }

    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) throw new Error('DCQL vp_token object is empty');

    let firstDecoded: { header: unknown; payload: unknown } | undefined;
    for (const [, value] of entries) {
        const presentations = Array.isArray(value) ? value : [value];
        for (const p of presentations) {
            if (typeof p !== 'string' || !isCompactJws(p)) {
                throw new Error('DCQL presentation is not a compact JWS');
            }
            const decoded = await verifyVpJwt(p, ctx);
            firstDecoded ??= decoded;
        }
    }

    return firstDecoded ?? { header: {}, payload: {} };
};

/* -------------------------- JWT verification ------------------------------ */

const verifyVpJwt = async (
    jwt: string,
    ctx: { audience: string; nonce: string }
): Promise<{ header: unknown; payload: unknown }> => {
    const [, payloadB64] = jwt.split('.');
    const unverifiedPayload = JSON.parse(b64urlToUtf8(payloadB64!)) as {
        iss?: unknown;
    };

    if (typeof unverifiedPayload.iss !== 'string') {
        throw new Error('VP JWT has no iss claim');
    }

    const holderKey = await didJwkToKey(unverifiedPayload.iss, 'EdDSA');

    const { protectedHeader, payload } = await jwtVerify(jwt, holderKey, {
        audience: ctx.audience,
    });

    if (payload.nonce !== ctx.nonce) {
        throw new Error(`nonce mismatch (got ${String(payload.nonce)}, expected ${ctx.nonce})`);
    }

    return { header: protectedHeader, payload };
};

const verifyIdToken = async (
    jwt: string,
    ctx: { audience: string; nonce: string }
): Promise<{ header: unknown; payload: unknown }> => {
    const [, payloadB64] = jwt.split('.');
    const unverifiedPayload = JSON.parse(b64urlToUtf8(payloadB64!)) as {
        iss?: unknown;
        sub?: unknown;
    };

    // SIOPv2 §9: iss is either the holder's DID or the reserved value
    // "https://self-issued.me/v2". sub is the holder DID. Both must
    // agree on the holder identity.
    const candidateDid =
        typeof unverifiedPayload.sub === 'string' ? unverifiedPayload.sub : undefined;

    if (!candidateDid) {
        throw new Error('id_token has no sub claim');
    }

    const holderKey = await didJwkToKey(candidateDid, 'EdDSA');

    const { protectedHeader, payload } = await jwtVerify(jwt, holderKey, {
        audience: ctx.audience,
    });

    if (payload.nonce !== ctx.nonce) {
        throw new Error(
            `id_token nonce mismatch (got ${String(payload.nonce)}, expected ${ctx.nonce})`
        );
    }

    return { header: protectedHeader, payload };
};

const didJwkToKey = async (did: string, alg: string) => {
    if (!did.startsWith('did:jwk:')) {
        throw new Error(`verifier only knows did:jwk (got ${did})`);
    }
    const id = did.replace(/^did:jwk:/, '').split('#')[0]!;
    const jwk = JSON.parse(b64urlToUtf8(id)) as JWK;
    return importJWK(jwk, alg);
};

/* -------------------------------------------------------------------------- */
/*                                  utils                                     */
/* -------------------------------------------------------------------------- */

const isCompactJws = (s: string): boolean =>
    /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(s);

const b64urlToUtf8 = (s: string): string => {
    const pad = '='.repeat((4 - (s.length % 4)) % 4);
    return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64').toString('utf8');
};

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));

const randomId = (): string => {
    const { randomBytes } = require('node:crypto') as typeof import('node:crypto');
    return randomBytes(12).toString('hex');
};
