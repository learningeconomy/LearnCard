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
import { decodeJwt, decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';

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

export interface SphereonPexSessionInput {
    /**
     * DIF PEX v2 Presentation Definition the wallet must satisfy.
     * Type intentionally loose — Sphereon's `PEX` accepts both V1
     * and V2 shapes; we don't want to couple this helper to a
     * specific PEX type version.
     */
    presentationDefinition: Record<string, unknown>;

    /** See {@link SphereonCommonSessionInput.audience}. */
    audience?: string;
    /** See {@link SphereonCommonSessionInput.nonce}. */
    nonce?: string;
}

export interface SphereonDcqlSessionInput {
    /**
     * Parsed DCQL query the wallet must satisfy. Test code typically
     * builds this via the plugin's `requestW3cVc` (verifier composer
     * helper) or hand-rolls the input and runs it through
     * `parseDcqlQuery`.
     */
    dcqlQuery: Record<string, unknown>;

    /** See {@link SphereonCommonSessionInput.audience}. */
    audience?: string;
    /** See {@link SphereonCommonSessionInput.nonce}. */
    nonce?: string;
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
 */
export const startSphereonVerifier = async (
    opts: { port?: number } = {}
): Promise<SphereonVerifier> => {
    const sessions = new Map<string, SessionRecord>();
    const pex = new PEX();

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

    const handleDirectPost = async (
        req: import('node:http').IncomingMessage,
        res: ServerResponse
    ): Promise<void> => {
        let stateForErrorPath: string | undefined;
        let session: SessionRecord | undefined;

        try {
            const body = await readBody(req);
            const params = new URLSearchParams(body);

            const vpToken = params.get('vp_token');
            const submissionStr = params.get('presentation_submission');
            const state = params.get('state');

            stateForErrorPath = state ?? undefined;

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

            // Build the auth-request URI inline. Order matches what
            // walt.id emits so a plugin path that's accidentally
            // sensitive to query-param order shows up in both
            // suites, not just one.
            const params: Record<string, string> = {
                client_id: clientId,
                response_type: 'vp_token',
                response_mode: 'direct_post',
                response_uri: responseUri,
                nonce: nonceVal,
                state,
            };

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
