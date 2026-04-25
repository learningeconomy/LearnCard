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
import { decodeJwt, decodeProtectedHeader, importJWK, jwtVerify, type JWK } from 'jose';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface SphereonCreateSessionInput {
    /**
     * DIF PEX v2 Presentation Definition the wallet must satisfy.
     * Type intentionally loose — Sphereon's `PEX` accepts both V1
     * and V2 shapes; we don't want to couple this helper to a
     * specific PEX type version.
     */
    presentationDefinition: Record<string, unknown>;

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

interface SessionRecord {
    state: string;
    nonce: string;
    clientId: string;
    presentationDefinition: Record<string, unknown>;
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
            if (!submissionStr) throw new Error('missing presentation_submission');
            if (!state) throw new Error('missing state');

            session = sessions.get(state);
            if (!session) throw new Error(`unknown state: ${state}`);

            // Cache for the catch block.
            stateForErrorPath = session.state;

            const submission = JSON.parse(submissionStr);

            // 1) Parse + verify the VP JWT signature.
            // The plugin emits jwt_vp_json by default for our flows;
            // if a future spec exercises ldp_vp this branch will need
            // a JSON-LD path. Throwing loudly is the right move until
            // then so silent skips don't mask coverage gaps.
            if (typeof vpToken !== 'string' || vpToken.split('.').length !== 3) {
                throw new Error(
                    `expected compact JWT-VP, got: ${typeof vpToken === 'string' ? vpToken.slice(0, 40) : typeof vpToken}…`
                );
            }

            const header = decodeProtectedHeader(vpToken);
            const payload = decodeJwt(vpToken);

            const issDid = payload.iss;
            if (typeof issDid !== 'string' || !issDid.startsWith('did:jwk:')) {
                throw new Error(
                    `unsupported holder DID method (must be did:jwk in this harness): ${String(issDid)}`
                );
            }

            const holderJwk = decodeDidJwk(issDid);
            const holderKey = await importJWK(holderJwk, header.alg ?? 'EdDSA');

            // jwtVerify also validates `exp`/`nbf` if present and is
            // the right place for signature errors to surface.
            await jwtVerify(vpToken, holderKey);

            // 2) Nonce binding — the heart of the replay-rejection guarantee.
            if (payload.nonce !== session.nonce) {
                throw new Error(
                    `nonce mismatch: VP carries nonce="${String(payload.nonce)}" but session "${session.state}" issued nonce="${session.nonce}"`
                );
            }

            // 3) Audience binding — the heart of cross-verifier replay rejection.
            const aud = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
            if (aud !== session.clientId) {
                throw new Error(
                    `audience mismatch: VP carries aud="${String(aud)}" but session expects "${session.clientId}"`
                );
            }

            // 4) PEX evaluation — Sphereon's strict descriptor-map
            // walker confirms each PD input descriptor is satisfied
            // by exactly one credential in the VP at the path the
            // submission claims.
            //
            // CRITICAL: pass the raw JWT-VP string (not the decoded
            // `vp` claim). The plugin's descriptor_map paths are
            // shaped per the OID4VP §6.1 conventions for jwt_vp_json
            // submissions — `path: "$"` resolves to the JWT itself,
            // and `path_nested.path: "$.vp.verifiableCredential[N]"`
            // walks into the JWT payload's `vp` claim. If we hand
            // PEX an already-unwrapped `vp` object, the nested path
            // hits a `vp` key that doesn't exist (we already peeled
            // it off) and PEX rejects the submission. Sphereon's
            // PEX accepts a JWT string directly and decodes it
            // internally for path evaluation.
            if (!('vp' in payload) || typeof (payload as { vp?: unknown }).vp !== 'object') {
                throw new Error('JWT-VP payload has no `vp` claim');
            }

            const pexResult = pex.evaluatePresentation(
                session.presentationDefinition as Parameters<PEX['evaluatePresentation']>[0],
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

            // 5) Inner VC signature verification — proves the wallet
            // didn't substitute a self-signed VC into the envelope.
            // Walt.id-issued VCs have `iss` = walt.id's per-run
            // did:jwk; we verify against that.
            const vp = (payload as { vp?: { verifiableCredential?: unknown[] } }).vp ?? {};
            const vcs = vp.verifiableCredential ?? [];
            for (const vcEntry of vcs) {
                if (typeof vcEntry !== 'string') {
                    // ldp_vc (object form) requires a JSON-LD verifier;
                    // out of scope for this harness. We let it pass
                    // through PEX evaluation but don't claim signature
                    // verification.
                    continue;
                }

                if (vcEntry.split('.').length !== 3) {
                    throw new Error(
                        `inner VC entry is not a compact JWT: ${vcEntry.slice(0, 40)}…`
                    );
                }

                const vcHeader = decodeProtectedHeader(vcEntry);
                const vcPayload = decodeJwt(vcEntry);
                const vcIss = vcPayload.iss;

                if (typeof vcIss !== 'string' || !vcIss.startsWith('did:jwk:')) {
                    // Out of scope for this harness — same reasoning as the holder DID guard.
                    continue;
                }

                const issuerJwk = decodeDidJwk(vcIss);
                const issuerKey = await importJWK(issuerJwk, vcHeader.alg ?? 'EdDSA');

                await jwtVerify(vcEntry, issuerKey);
            }

            // All checks passed.
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

        createSession({ presentationDefinition, audience, nonce }) {
            const state = randomState();
            const nonceVal = nonce ?? randomState();
            const clientId = audience ?? 'sphereon-interop-verifier';
            const responseUri = `${baseUrl}/direct_post`;

            sessions.set(state, {
                state,
                nonce: nonceVal,
                clientId,
                presentationDefinition,
                responseUri,
                verificationResult: null,
                errors: [],
            });

            // Build the auth-request URI inline. Order matches what
            // walt.id emits so a plugin path that's accidentally
            // sensitive to query-param order shows up in both
            // suites, not just one.
            const params = new URLSearchParams({
                client_id: clientId,
                response_type: 'vp_token',
                response_mode: 'direct_post',
                response_uri: responseUri,
                nonce: nonceVal,
                state,
                presentation_definition: JSON.stringify(presentationDefinition),
            });

            return {
                state,
                nonce: nonceVal,
                clientId,
                authorizationRequestUri: `openid4vp://authorize?${params.toString()}`,
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
