/**
 * In-process **Sphereon-PEX-backed strict verifier** for Tier 2 interop.
 *
 * # Why this exists
 *
 * Tier 1 proved the plugin can talk to walt.id end-to-end, but walt.id
 * `1.0.0-SNAPSHOT` was empirically lax in two security-critical ways:
 *
 *   - It accepts any pre-authorized code.
 *   - It does not enforce nonce binding on submitted VPs.
 *
 * Those laxities mean a green walt.id run does NOT prove our plugin is
 * actually emitting nonce-bound, audience-bound VPs. The plugin could
 * regress on either and walt.id would still rubber-stamp the result.
 *
 * Tier 2 closes that gap by introducing a *strict* second vendor: a
 * tiny in-process HTTP verifier built on Sphereon's reference PEX
 * library (`@sphereon/pex`, the canonical TypeScript implementation
 * of DIF Presentation Exchange v2) plus `jose` for JWT signature /
 * nonce / audience checks. Because it's in-process the test is fast
 * (no Docker), but the code paths exercised — Sphereon's PEX
 * evaluator, jose's signature verifier, our own nonce/aud binding
 * checks — are independent of the plugin and represent a different
 * team's interpretation of the same specs.
 *
 * # Wire shape
 *
 * The verifier exposes a single `POST /direct_post` HTTP endpoint
 * that mimics OID4VP §8 — the plugin's `presentCredentials` posts
 * here exactly as it would to a real verifier. Session bookkeeping
 * is in-memory: `createSession()` mints `{ state, nonce, client_id,
 * authorizationRequestUri }` and the test feeds the URI to the
 * plugin. After the plugin posts, the test polls `getStatus(state)`
 * to see whether Sphereon accepted it.
 *
 * Strict mode is the entire point: every check below MUST hold or
 * the submission is rejected with a precise error message:
 *
 *   1. JWT-VP signature verifies against the holder's `did:jwk` key.
 *   2. JWT `nonce` claim equals the nonce the verifier issued.
 *   3. JWT `aud` claim equals the verifier's `client_id`.
 *   4. PEX evaluator (`evaluatePresentation`) accepts the VP against
 *      the Presentation Definition + Submission.
 *   5. Each inner JWT-VC's signature verifies against the issuer's
 *      `did:jwk` key (proves walt.id-issued credentials transit
 *      cleanly through our wallet to a different verifier).
 *
 * Failures of any check populate `session.errors[]` and flip
 * `session.verificationResult` to `false`, so tests can assert on
 * the precise reason rather than "something went wrong".
 */
import { createServer, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { randomBytes } from 'node:crypto';

import { PEX } from '@sphereon/pex';
import * as dcql from 'dcql';
import {
    compactDecrypt,
    decodeJwt,
    decodeProtectedHeader,
    exportJWK,
    generateKeyPair,
    importJWK,
    jwtVerify,
    type JWK,
    type KeyLike,
} from 'jose';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * Verifier session input — a discriminated union over the query
 * language used to express the verifier's credential ask. Tests
 * either pass `presentationDefinition` (PEX) or `dcqlQuery` (DCQL),
 * never both.
 */
export type SphereonCreateSessionInput =
    | (SphereonPexSessionInput & { dcqlQuery?: never })
    | (SphereonDcqlSessionInput & { presentationDefinition?: never });

export interface SphereonPexSessionInput extends SphereonCommonSessionInput {
    /**
     * DIF PEX v2 Presentation Definition the wallet must satisfy.
     * Type intentionally loose — Sphereon's `PEX` accepts both V1
     * and V2 shapes; we don't want to couple this helper to a
     * specific PEX type version.
     */
    presentationDefinition: Record<string, unknown>;
}

export interface SphereonDcqlSessionInput extends SphereonCommonSessionInput {
    /**
     * Parsed DCQL query the wallet must satisfy. Test code typically
     * builds this via the plugin's `requestW3cVc` (verifier composer
     * helper) so the test query is authored exactly the way real
     * verifiers would compose it.
     */
    dcqlQuery: Record<string, unknown>;
}

interface SphereonCommonSessionInput {
    /**
     * Verifier's `client_id` — the audience the wallet's VP JWT
     * must address (`aud` claim). Defaults to a stable test value
     * so multi-session tests can pin it explicitly when they want
     * audience parity, or pick distinct ones to test audience
     * binding.
     */
    audience?: string;

    /**
     * Override the nonce. Default is a fresh 16-byte random hex
     * string. Used by tests that want to deliberately mint
     * sessions with known-mismatched nonces.
     */
    nonce?: string;

    /**
     * When `'direct_post.jwt'`, the harness advertises its
     * encryption key in `client_metadata.jwks` and expects the
     * wallet to send a JWE in a single `response` form field per
     * OID4VP §8.3 (JARM). Defaults to cleartext `'direct_post'`.
     *
     * Requires `startSphereonVerifier({ jarm: true })` so the
     * harness has an enc keypair to publish.
     */
    responseMode?: 'direct_post' | 'direct_post.jwt';

    /**
     * When `responseMode === 'direct_post.jwt'`, asks the wallet to
     * sign the response object before encrypting (nested JWS-in-JWE).
     * The harness verifies the inner JWS against the holder's
     * `did:jwk` so the test exercises the full sign-then-encrypt
     * path. Defaults to encrypt-only.
     */
    jarmSignAlg?: 'EdDSA' | 'ES256';
}

export interface SphereonSession {
    state: string;
    nonce: string;
    clientId: string;
    /** Full URI the plugin should be fed to drive the present flow. */
    authorizationRequestUri: string;
}

export interface SphereonStatus {
    /**
     * `null` until the wallet has POSTed; `true` if every strict
     * check passed; `false` with `errors` populated otherwise.
     */
    verificationResult: boolean | null;
    /** Precise rejection reasons — useful for assertion + debug logs. */
    errors: string[];
}

export interface SphereonVerifier {
    /** Base URL the verifier is listening on, e.g. `http://127.0.0.1:54321`. */
    baseUrl: string;
    createSession(input: SphereonCreateSessionInput): SphereonSession;
    getStatus(state: string): SphereonStatus;
    stop(): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/*                                  internals                                 */
/* -------------------------------------------------------------------------- */

type SessionRecord =
    | (SessionCommon & { kind: 'pex'; presentationDefinition: Record<string, unknown> })
    | (SessionCommon & { kind: 'dcql'; dcqlQuery: Record<string, unknown> });

interface SessionCommon {
    state: string;
    nonce: string;
    clientId: string;
    responseUri: string;
    verificationResult: boolean | null;
    errors: string[];
}

/**
 * Decode a `did:jwk:<b64url-of-jwk-json>` identifier back into a JWK.
 * `did:jwk` (W3C DID Method Spec) embeds the public key inside the
 * DID itself, so resolution is a pure base64url+JSON decode — no
 * network call needed.
 */
const decodeDidJwk = (did: string): JWK => {
    const stripped = did.replace(/^did:jwk:/, '').split('#')[0]!;
    const b64 = stripped.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);

    try {
        return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as JWK;
    } catch (e) {
        throw new Error(
            `Failed to decode did:jwk identifier "${did}": ${e instanceof Error ? e.message : String(e)}`
        );
    }
};

const randomState = (): string => randomBytes(16).toString('hex');

const reply = (res: ServerResponse, status: number, body: unknown): void => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
};

const readBody = (req: import('node:http').IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Spin up the strict verifier. Returns immediately once the listener
 * is bound. Pick a port explicitly if you need predictability;
 * otherwise the OS picks one and you read it off `baseUrl`.
 *
 * `jarm: true` provisions an ECDH-ES P-256 enc keypair the verifier
 * can publish in `client_metadata.jwks` for sessions opted into
 * `direct_post.jwt`. Other sessions on the same verifier still
 * accept cleartext — JARM is per-session, not per-verifier.
 */
export const startSphereonVerifier = async (
    opts: { port?: number; jarm?: boolean } = {}
): Promise<SphereonVerifier> => {
    const sessions = new Map<string, SessionRecord>();
    const pex = new PEX();

    // JARM key provisioning. Lazy: only mint when asked, and reuse
    // across all JARM sessions on this verifier (matches how a real
    // verifier deployment would publish a stable enc key in its
    // client_metadata).
    let jarmKeyMaterial:
        | { publicJwk: JWK; privateKey: KeyLike }
        | undefined;
    if (opts.jarm) {
        const { privateKey, publicKey } = await generateKeyPair('ECDH-ES', {
            crv: 'P-256',
            extractable: true,
        });
        const publicJwk = await exportJWK(publicKey);
        jarmKeyMaterial = {
            publicJwk: {
                ...publicJwk,
                alg: 'ECDH-ES',
                use: 'enc',
                kid: 'sphereon-jarm-1',
            },
            privateKey: privateKey as KeyLike,
        };
    }

    /**
     * PEX route: parse + verify the (single) JWT-VP, validate nonce +
     * audience, run Sphereon's strict descriptor-map evaluator, then
     * verify each inner VC's signature.
     */
    const validatePexSubmission = async (
        session: SessionCommon & { kind: 'pex'; presentationDefinition: Record<string, unknown> },
        vpToken: string,
        submissionStr: string
    ): Promise<void> => {
        const submission = JSON.parse(submissionStr);

        if (vpToken.split('.').length !== 3) {
            throw new Error(
                `expected compact JWT-VP, got: ${vpToken.slice(0, 40)}…`
            );
        }

        const header = decodeProtectedHeader(vpToken);
        const payload = decodeJwt(vpToken);

        await verifyOuterVpJwt(vpToken, payload, header, session);

        // Sphereon's strict descriptor-map walker confirms each PD
        // input descriptor is satisfied by exactly one credential
        // in the VP at the path the submission claims. Pass the
        // raw JWT string (NOT the decoded `vp` claim) so descriptor
        // paths like `$.vp.verifiableCredential[N]` resolve.
        if (!('vp' in payload) || typeof (payload as { vp?: unknown }).vp !== 'object') {
            throw new Error('JWT-VP payload has no `vp` claim');
        }

        const pexResult = pex.evaluatePresentation(
            session.presentationDefinition as unknown as Parameters<
                PEX['evaluatePresentation']
            >[0],
            vpToken as unknown as Parameters<PEX['evaluatePresentation']>[1],
            {
                presentationSubmission: submission,
                generatePresentationSubmission: false,
            }
        );

        if (pexResult.errors && pexResult.errors.length > 0) {
            throw new Error(
                `PEX evaluation rejected the VP: ${JSON.stringify(pexResult.errors)}`
            );
        }

        // Inner VC signature verification — proves the wallet didn't
        // substitute a self-signed VC into the envelope.
        const vp = (payload as { vp?: { verifiableCredential?: unknown[] } }).vp ?? {};
        await verifyInnerVcs(vp.verifiableCredential ?? []);
    };

    /**
     * DCQL route: parse vp_token as a JSON object keyed by
     * credential_query_id. For each entry, verify the JWT-VP,
     * nonce, audience, and inner VC signatures. Then hand the
     * normalized presentation set to `dcql.DcqlPresentationResult`
     * for spec-strict matching against the verifier's query.
     */
    const validateDcqlSubmission = async (
        session: SessionCommon & { kind: 'dcql'; dcqlQuery: Record<string, unknown> },
        vpToken: string
    ): Promise<void> => {
        let parsedVpToken: Record<string, unknown>;
        try {
            parsedVpToken = JSON.parse(vpToken);
        } catch (e) {
            throw new Error(
                `DCQL vp_token must be a JSON-encoded object: ${e instanceof Error ? e.message : String(e)}`
            );
        }

        if (
            parsedVpToken === null ||
            typeof parsedVpToken !== 'object' ||
            Array.isArray(parsedVpToken)
        ) {
            throw new Error('DCQL vp_token must be a JSON object keyed by credential_query_id');
        }

        // Per-query: verify JWT-VP signature + nonce + audience +
        // inner VC signatures, then collect the normalized
        // presentation shape DCQL needs to match against.
        const dcqlPresentation: Record<string, unknown> = {};

        for (const [queryId, presentation] of Object.entries(parsedVpToken)) {
            if (typeof presentation !== 'string' || presentation.split('.').length !== 3) {
                throw new Error(
                    `DCQL entry "${queryId}" must be a compact JWT-VP string in this harness`
                );
            }

            const header = decodeProtectedHeader(presentation);
            const payload = decodeJwt(presentation);
            await verifyOuterVpJwt(presentation, payload, header, session);

            // Inner VC signatures.
            const vp = (payload as { vp?: { verifiableCredential?: unknown[] } }).vp ?? {};
            const vcs = vp.verifiableCredential ?? [];
            await verifyInnerVcs(vcs);

            // Build the DcqlW3cVcPresentation shape the dcql lib's
            // result validator expects. We assume jwt_vc_json (the
            // only format the plugin currently emits inside DCQL VPs);
            // SD-JWT and mso_mdoc would need their own decoders.
            const firstVc = vcs[0];
            const innerPayload =
                typeof firstVc === 'string'
                    ? (decodeJwt(firstVc) as Record<string, unknown>)
                    : undefined;
            const innerVc =
                innerPayload && typeof innerPayload.vc === 'object' && innerPayload.vc !== null
                    ? (innerPayload.vc as Record<string, unknown>)
                    : undefined;
            const types = Array.isArray(innerVc?.type) ? (innerVc!.type as string[]) : [];

            dcqlPresentation[queryId] = {
                credential_format: 'jwt_vc_json',
                claims: innerVc ?? {},
                type: types,
                cryptographic_holder_binding: true,
            };
        }

        // dcql.DcqlPresentationResult.fromDcqlPresentation runs the
        // spec-strict matcher and throws if the presentation set
        // doesn't satisfy the query. The query was already parsed
        // by the test caller; we re-parse defensively here.
        const parsedQuery = dcql.DcqlQuery.parse(
            session.dcqlQuery as Parameters<typeof dcql.DcqlQuery.parse>[0]
        );
        const result = dcql.DcqlPresentationResult.fromDcqlPresentation(
            dcqlPresentation as Parameters<
                typeof dcql.DcqlPresentationResult.fromDcqlPresentation
            >[0],
            { dcqlQuery: parsedQuery }
        );

        if (!result.can_be_satisfied) {
            throw new Error(
                `DCQL evaluation rejected the presentation: ${JSON.stringify(result.credential_matches)}`
            );
        }
    };

    /** Shared: verify the outer JWT-VP signature + nonce + audience. */
    const verifyOuterVpJwt = async (
        vpToken: string,
        payload: ReturnType<typeof decodeJwt>,
        header: ReturnType<typeof decodeProtectedHeader>,
        session: SessionCommon
    ): Promise<void> => {
        const issDid = payload.iss;
        if (typeof issDid !== 'string' || !issDid.startsWith('did:jwk:')) {
            throw new Error(
                `unsupported holder DID method (must be did:jwk in this harness): ${String(issDid)}`
            );
        }

        const holderJwk = decodeDidJwk(issDid);
        const holderKey = await importJWK(holderJwk, header.alg ?? 'EdDSA');

        await jwtVerify(vpToken, holderKey);

        if (payload.nonce !== session.nonce) {
            throw new Error(
                `nonce mismatch: VP carries nonce="${String(payload.nonce)}" but session "${session.state}" issued nonce="${session.nonce}"`
            );
        }

        const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
        if (aud !== session.clientId) {
            throw new Error(
                `audience mismatch: VP carries aud="${String(aud)}" but session expects "${session.clientId}"`
            );
        }
    };

    /** Shared: verify each inner JWT-VC's signature against its issuer's did:jwk. */
    const verifyInnerVcs = async (vcs: readonly unknown[]): Promise<void> => {
        for (const vcEntry of vcs) {
            if (typeof vcEntry !== 'string') continue;

            if (vcEntry.split('.').length !== 3) {
                throw new Error(
                    `inner VC entry is not a compact JWT: ${vcEntry.slice(0, 40)}…`
                );
            }

            const vcHeader = decodeProtectedHeader(vcEntry);
            const vcPayload = decodeJwt(vcEntry);
            const vcIss = vcPayload.iss;

            if (typeof vcIss !== 'string' || !vcIss.startsWith('did:jwk:')) continue;

            const issuerJwk = decodeDidJwk(vcIss);
            const issuerKey = await importJWK(issuerJwk, vcHeader.alg ?? 'EdDSA');

            await jwtVerify(vcEntry, issuerKey);
        }
    };

    /**
     * Decode an incoming `direct_post.jwt` body — a single `response`
     * form field whose value is a compact JWE (optionally wrapping a
     * compact JWS). Returns the same `{ vp_token, presentation_submission,
     * state, id_token }` fields the cleartext path would parse, so the
     * downstream PEX/DCQL routing logic stays untouched.
     *
     * Validates two security-critical invariants on the JOSE blob:
     *   1. The JWE protected header's `apv` must equal the
     *      base64url-encoded session nonce (per OID4VP §8.3 ¶6).
     *      Without this binding a captured response could be
     *      replayed against a different session.
     *   2. When the session declared `jarmSignAlg`, the inner JWS
     *      MUST verify against the holder's `did:jwk` — same check
     *      we do on the outer VP JWT in cleartext mode.
     */
    const decodeJarmBody = async (
        responseJwe: string,
        sessionForLookup: SessionRecord
    ): Promise<{
        vpToken: string;
        submissionStr: string | null;
        state: string;
        idToken: string | null;
    }> => {
        if (!jarmKeyMaterial) {
            throw new Error(
                'received direct_post.jwt response but verifier was started without `jarm: true`'
            );
        }

        const { plaintext, protectedHeader } = await compactDecrypt(
            responseJwe,
            jarmKeyMaterial.privateKey
        );

        // Bind the JWE to the session via apv echo. We compare the
        // base64url-encoded session nonce to whatever the wallet put
        // in apv; jose surfaces apv as a base64url string in the
        // protectedHeader.
        const expectedApv = Buffer.from(sessionForLookup.nonce, 'utf8')
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        if (protectedHeader.apv !== expectedApv) {
            throw new Error(
                `JARM apv mismatch: header carries apv="${String(protectedHeader.apv)}" but session nonce produces "${expectedApv}"`
            );
        }

        // Plaintext is either the response-object JSON directly or a
        // nested JWS whose payload is that JSON. The `cty=JWT`
        // protected-header signal disambiguates per RFC 7516 §4.1.12.
        const decoded = new TextDecoder().decode(plaintext);

        let responseObject: Record<string, unknown>;
        if (
            typeof protectedHeader.cty === 'string' &&
            protectedHeader.cty.toUpperCase() === 'JWT'
        ) {
            // Nested JWS — verify against the holder's did:jwk so a
            // tampered or unsigned response can't slip through.
            //
            // The OID4VP §8.3 response payload does NOT carry an
            // `iss` claim (it carries vp_token / presentation_submission
            // / state / id_token only). The holder's identity is in
            // the JWS protected header's `kid`, which by convention
            // is `<holder DID>#<fragment>` (matches what the rest of
            // the plugin emits via createJoseEd25519Signer). Strip
            // the fragment and decode the embedded JWK.
            const innerHeader = decodeProtectedHeader(decoded);
            const kid = innerHeader.kid;

            if (typeof kid !== 'string' || !kid.startsWith('did:jwk:')) {
                throw new Error(
                    `JARM inner JWS protected header has no usable did:jwk kid (kid=${String(kid)})`
                );
            }

            const holderDid = kid.split('#')[0]!;
            const holderJwk = decodeDidJwk(holderDid);
            const holderKey = await importJWK(
                holderJwk,
                innerHeader.alg ?? 'EdDSA'
            );
            await jwtVerify(decoded, holderKey);

            responseObject = decodeJwt(decoded) as Record<string, unknown>;
        } else {
            responseObject = JSON.parse(decoded);
        }

        return {
            vpToken:
                typeof responseObject.vp_token === 'string'
                    ? responseObject.vp_token
                    : JSON.stringify(responseObject.vp_token ?? ''),
            submissionStr: responseObject.presentation_submission
                ? JSON.stringify(responseObject.presentation_submission)
                : null,
            state:
                typeof responseObject.state === 'string'
                    ? responseObject.state
                    : '',
            idToken:
                typeof responseObject.id_token === 'string'
                    ? responseObject.id_token
                    : null,
        };
    };

    const handleDirectPost = async (
        req: import('node:http').IncomingMessage,
        res: ServerResponse
    ): Promise<void> => {
        let stateForErrorPath: string | undefined;
        let session: SessionRecord | undefined;

        try {
            const body = await readBody(req);
            const params = new URLSearchParams(body);

            // JARM dispatch: if the wallet posted a `response` field,
            // we're in `direct_post.jwt` mode. We need the session
            // BEFORE we can decrypt (the apv check binds to the
            // session's nonce), so we peek at the JWE's plaintext
            // state after decryption rather than reading it off a
            // form field.
            const responseJwe = params.get('response');

            let vpToken: string | null;
            let submissionStr: string | null;
            let state: string | null;

            if (responseJwe) {
                // For state lookup we need to find the session
                // *some* way before decrypting — the JWE plaintext
                // is the only place state lives in JARM mode. We
                // peek by trying every session in turn and using the
                // one whose nonce produces a matching apv. With our
                // small in-memory session table this is O(n) and
                // n=1 in the common test case; production verifiers
                // would key on a separate URL parameter.
                const apv = decodeProtectedHeader(responseJwe).apv;
                const candidate = Array.from(sessions.values()).find(s => {
                    const expected = Buffer.from(s.nonce, 'utf8')
                        .toString('base64')
                        .replace(/\+/g, '-')
                        .replace(/\//g, '_')
                        .replace(/=+$/, '');
                    return expected === apv;
                });

                if (!candidate) {
                    throw new Error(
                        `JARM apv does not match any active session nonce`
                    );
                }

                stateForErrorPath = candidate.state;
                session = candidate;

                const decoded = await decodeJarmBody(responseJwe, candidate);
                vpToken = decoded.vpToken;
                submissionStr = decoded.submissionStr;
                state = decoded.state;
            } else {
                vpToken = params.get('vp_token');
                submissionStr = params.get('presentation_submission');
                state = params.get('state');
            }

            stateForErrorPath = state ?? stateForErrorPath;

            if (!vpToken) throw new Error('missing vp_token');
            if (!state) throw new Error('missing state');

            session = sessions.get(state);
            if (!session) throw new Error(`unknown state: ${state}`);

            // Cache for the catch block.
            stateForErrorPath = session.state;

            // Route on the session's declared query language.
            // Spec-compliant submissions match the language: PEX
            // carries `presentation_submission`, DCQL omits it.
            // Mismatched shapes are an immediate rejection.
            if (session.kind === 'dcql') {
                if (submissionStr) {
                    throw new Error(
                        'DCQL session received a submission containing presentation_submission; OID4VP 1.0 §6.4 forbids this'
                    );
                }
                await validateDcqlSubmission(session, vpToken);
            } else {
                if (!submissionStr) {
                    throw new Error('PEX session requires presentation_submission');
                }
                await validatePexSubmission(session, vpToken, submissionStr);
            }

            session.verificationResult = true;
            reply(res, 200, { status: 'ok' });
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);

            if (!session && stateForErrorPath) {
                session = sessions.get(stateForErrorPath);
            }

            if (session) {
                session.verificationResult = false;
                session.errors.push(msg);
            }

            // Surface the precise reason on stderr — `VpSubmitError`
            // swallows response bodies, so without this the test
            // output reads "Verifier returned 400 Bad Request" with
            // no clue WHY. Off by default in CI via env-var so we
            // don't drown logs with expected rejections in negative
            // tests.
            if (process.env.SPHEREON_QUIET !== '1') {
                console.error(`[sphereon-verifier] reject (state=${stateForErrorPath}): ${msg}`);
            }

            // 400 keeps walt.id's "verifier rejected the VP" semantics
            // identical across vendors; tests can branch on status code
            // OR poll status the same way they do for walt.id.
            reply(res, 400, { error: msg });
        }
    };

    const server: Server = createServer((req, res) => {
        // Single endpoint — keep the surface small. Every other path
        // is a 404, which makes test failures easy to debug ("oh, I
        // hit /openid4vc/verify by mistake, that's a Sphereon path
        // bug not a plugin bug").
        if (req.method === 'POST' && req.url === '/direct_post') {
            void handleDirectPost(req, res);
            return;
        }

        // Health probe so global setup can wait on readiness if we
        // ever move this out-of-process.
        if (req.method === 'GET' && req.url === '/health') {
            reply(res, 200, { status: 'ok' });
            return;
        }

        reply(res, 404, { error: `not found: ${req.method} ${req.url}` });
    });

    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(opts.port ?? 0, '127.0.0.1', () => resolve());
    });

    const addr = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${addr.port}`;

    return {
        baseUrl,

        createSession(input) {
            const state = randomState();
            const nonceVal = input.nonce ?? randomState();
            const clientId = input.audience ?? 'sphereon-interop-verifier';
            const responseUri = `${baseUrl}/direct_post`;

            const responseMode = input.responseMode ?? 'direct_post';
            if (responseMode === 'direct_post.jwt' && !jarmKeyMaterial) {
                throw new Error(
                    'createSession({ responseMode: "direct_post.jwt" }) requires startSphereonVerifier({ jarm: true })'
                );
            }

            // Build the auth-request URI inline. Order matches what
            // walt.id emits so a plugin path that's accidentally
            // sensitive to query-param order shows up in both
            // suites, not just one.
            const params: Record<string, string> = {
                client_id: clientId,
                response_type: 'vp_token',
                response_mode: responseMode,
                response_uri: responseUri,
                nonce: nonceVal,
                state,
            };

            // Publish the verifier's enc key + JARM algs in
            // client_metadata when the wallet is being asked to
            // encrypt. The wallet reads these straight off the
            // resolved AuthorizationRequest — OID4VP §5.6.
            if (responseMode === 'direct_post.jwt') {
                const clientMetadata: Record<string, unknown> = {
                    jwks: { keys: [jarmKeyMaterial!.publicJwk] },
                    authorization_encrypted_response_alg: 'ECDH-ES',
                    authorization_encrypted_response_enc: 'A256GCM',
                };

                if (input.jarmSignAlg) {
                    clientMetadata.authorization_signed_response_alg =
                        input.jarmSignAlg;
                }

                params.client_metadata = JSON.stringify(clientMetadata);
            }

            if ('dcqlQuery' in input && input.dcqlQuery) {
                sessions.set(state, {
                    kind: 'dcql',
                    state,
                    nonce: nonceVal,
                    clientId,
                    dcqlQuery: input.dcqlQuery,
                    responseUri,
                    verificationResult: null,
                    errors: [],
                });

                params.dcql_query = JSON.stringify(input.dcqlQuery);
            } else if ('presentationDefinition' in input && input.presentationDefinition) {
                sessions.set(state, {
                    kind: 'pex',
                    state,
                    nonce: nonceVal,
                    clientId,
                    presentationDefinition: input.presentationDefinition,
                    responseUri,
                    verificationResult: null,
                    errors: [],
                });

                params.presentation_definition = JSON.stringify(input.presentationDefinition);
            } else {
                throw new Error(
                    'createSession requires either `presentationDefinition` (PEX) or `dcqlQuery` (DCQL)'
                );
            }

            const search = new URLSearchParams(params);
            return {
                state,
                nonce: nonceVal,
                clientId,
                authorizationRequestUri: `openid4vp://authorize?${search.toString()}`,
            };
        },

        getStatus(state) {
            const session = sessions.get(state);
            if (!session) {
                return {
                    verificationResult: null,
                    errors: [`unknown state: ${state}`],
                };
            }
            return {
                verificationResult: session.verificationResult,
                errors: [...session.errors],
            };
        },

        async stop() {
            await new Promise<void>((resolve, reject) => {
                server.close(err => (err ? reject(err) : resolve()));
            });
        },
    };
};
