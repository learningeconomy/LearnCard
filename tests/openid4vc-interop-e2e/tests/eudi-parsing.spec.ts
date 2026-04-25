/**
 * Interop — **EU Digital Identity Wallet reference verifier**.
 *
 * Tier 2.C of the interop suite. The EUDI verifier is the OID4VP 1.0
 * reference impl maintained by the EU Commission's DG-Connect / Joinup
 * wallet effort — the closest thing to "what production EU wallets
 * actually integrate against" we have access to.
 *
 * # Honest interop reporting: what works, what's blocked
 *
 * Two real plugin gaps surfaced while wiring this up. They're tracked
 * as follow-up slices, not Tier 2.C work:
 *
 * **Gap 1 — Credential format mismatch**
 *   EUDI's verifier accepts only `mso_mdoc` and `dc+sd-jwt`; the
 *   plugin currently emits `jwt_vc_json` (W3C JWT-VC). EUDI rejects
 *   our credentials with `{"error":"UnsupportedFormat"}` at the
 *   submission boundary. A full credential roundtrip is blocked
 *   until the plugin gains SD-JWT-VC presentation support
 *   (key-binding JWT signing, selective-disclosure handling).
 *
 * **Gap 2 — OID4VP 1.0 client-id-prefix semantics**
 *   EUDI's default `pre-registered` mode emits a bare
 *   `client_id: "Verifier"` with no scheme prefix; OID4VP 1.0 §5.10
 *   inferes the prefix from registration metadata. Our plugin's
 *   Slice 7.5 JAR verifier requires `client_id_scheme` explicitly
 *   (draft-22 semantics) and throws `RequestObjectError(
 *   'missing_client_id_scheme', ...)`. The natural EUDI workaround
 *   (`VERIFIER_CLIENTIDPREFIX=x509_san_dns`) is itself blocked by
 *   the bundled access cert's SAN not matching the default
 *   ORIGINALCLIENTID — so the cleanest fix is plugin-side.
 *
 * # What this spec proves today
 *
 * One active test: the **EUDI service is reachable, configured
 * correctly, and emits OID4VP 1.0 spec-shape responses**. That alone
 * is a meaningful interop signal — it pins the docker-compose env
 * vars, the global-setup readiness probe, and the eudi-client.ts
 * helpers in working state, so the moment the two plugin gaps close
 * the suite picks up roundtrip coverage with zero infrastructure
 * work.
 *
 * Two skipped tests preserve the actual round-trip assertions
 * verbatim, gated on the plugin slices that unblock them. Re-enable
 * each `it.skip` → `it` once the corresponding feature ships.
 */
import { describe, expect, it } from 'vitest';

import { getOpenID4VCPlugin, requestW3cVc } from '@learncard/openid4vc-plugin';

import { createEudiVerifySession } from '../setup/eudi-client';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const EUDI_BASE_URL = process.env.EUDI_VERIFIER_BASE_URL ?? 'http://localhost:7004';

const getPlugin = (mock: MockLearnCardHandle) => {
    // EUDI signs Request Objects with an embedded self-signed test
    // certificate (alg=ES512, kid=access_certificate). The plugin's
    // unsafeAllowSelfSignedRequestObject flag accepts the JWS
    // without a chain validation — correct for an interop test
    // against a known reference verifier; production wallets must
    // keep this flag off.
    const plugin = getOpenID4VCPlugin(mock.learnCard, {
        unsafeAllowSelfSignedRequestObject: true,
    });
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

const SD_JWT_PID_QUERY = {
    credentials: [
        {
            id: 'eu_pid',
            format: 'dc+sd-jwt',
            meta: { vct_values: ['urn:eudi:pid:1'] },
        },
    ],
};

describe('interop: EUDI reference verifier (Tier 2.C)', () => {
    /* ----------------------- active interop signal ----------------------- */

    it('mints a session against EUDI and returns OID4VP 1.0 spec-shape response', async () => {
        // No plugin involvement — pure HTTP interaction with EUDI.
        // Proves the docker-compose env vars (PUBLICURL, RESPONSE_MODE,
        // REQUESTJWT_EMBED) are correct, EUDI accepts our DCQL query,
        // and the response shape matches the spec.
        const session = await createEudiVerifySession({
            verifierBaseUrl: EUDI_BASE_URL,
            dcqlQuery: SD_JWT_PID_QUERY,
        });

        expect(session.transactionId).toBeTypeOf('string');
        expect(session.transactionId.length).toBeGreaterThan(0);
        expect(session.clientId).toBeTypeOf('string');

        // jar_mode: by_value → `request` (compact JWS) is inlined.
        expect(session.request).toBeDefined();
        expect(session.request!.split('.')).toHaveLength(3);
        expect(session.requestUri).toBeUndefined();

        // The auth-request URI we hand the wallet must be a valid
        // openid4vp:// URI with the JAR inlined as the `request`
        // parameter.
        expect(session.authorizationRequestUri).toMatch(/^openid4vp:\/\/authorize\?/);
        const params = new URLSearchParams(
            session.authorizationRequestUri.split('?')[1] ?? ''
        );
        expect(params.get('client_id')).toBe(session.clientId);
        expect(params.get('request')).toBe(session.request);

        // Decode the JWS payload and assert the DCQL query round-tripped.
        const payloadJson = JSON.parse(
            Buffer.from(session.request!.split('.')[1]!, 'base64').toString('utf8')
        ) as { dcql_query?: { credentials?: Array<{ id: string; format: string }> } };

        expect(payloadJson.dcql_query?.credentials).toHaveLength(1);
        expect(payloadJson.dcql_query?.credentials?.[0]?.id).toBe('eu_pid');
        expect(payloadJson.dcql_query?.credentials?.[0]?.format).toBe('dc+sd-jwt');
    });

    /* ---------------- blocked: plugin OID4VP 1.0 client-id support ----- */

    /**
     * **SKIPPED** — Gap 2 in this file's docstring. EUDI emits
     * `client_id: "Verifier"` with no `client_id_scheme` claim
     * (OID4VP 1.0 §5.10 client-id-prefix semantics); the plugin's
     * Slice 7.5 JAR verifier rejects this with
     * `RequestObjectError('missing_client_id_scheme', ...)`.
     *
     * Re-enable once the plugin gains OID4VP 1.0 client-id-prefix
     * support (parse `<scheme>:<value>` out of `client_id`, fall
     * back to `pre-registered` when no prefix is present).
     */
    it.skip("[blocked: OID4VP 1.0 client-id-prefix support] plugin resolves EUDI's signed Request Object", async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const session = await createEudiVerifySession({
            verifierBaseUrl: EUDI_BASE_URL,
            dcqlQuery: SD_JWT_PID_QUERY,
        });

        const resolved = await plugin.resolveAuthorizationRequest(
            session.authorizationRequestUri
        );

        expect(resolved.client_id).toBeDefined();
        expect(resolved.dcql_query).toBeDefined();
        expect(resolved.presentation_definition).toBeUndefined();

        const credentials = (
            resolved.dcql_query as { credentials: Array<{ id: string; format: string }> }
        ).credentials;
        expect(credentials[0]?.id).toBe('eu_pid');
        expect(credentials[0]?.format).toBe('dc+sd-jwt');
    });

    /* ---------------- blocked: same as above + format gap -------------- */

    /**
     * **SKIPPED** — depends on the previous test passing. Once the
     * plugin can resolve EUDI's Request Object, the next signal is
     * that the selector cleanly identifies the format gap (we hold
     * `jwt_vc_json`, EUDI asks for `dc+sd-jwt`) without throwing.
     * UI relies on this `canSatisfy=false` path to render
     * "you don't have a matching credential".
     */
    it.skip("[blocked: OID4VP 1.0 client-id-prefix support] selector reports format-gap canSatisfy=false", async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const session = await createEudiVerifySession({
            verifierBaseUrl: EUDI_BASE_URL,
            dcqlQuery: SD_JWT_PID_QUERY,
        });

        const noopCandidates = [
            {
                credential: 'eyJhbGc.eyJ2Yy.sig', // bogus jwt_vc_json
                format: 'jwt_vc_json' as const,
            },
        ];

        const { dcqlSelection, selection } = await plugin.prepareVerifiablePresentation(
            session.authorizationRequestUri,
            noopCandidates
        );

        expect(selection).toBeUndefined();
        expect(dcqlSelection).toBeDefined();
        expect(dcqlSelection.canSatisfy).toBe(false);
        expect(dcqlSelection.matches.eu_pid?.candidates).toHaveLength(0);
        expect(dcqlSelection.matches.eu_pid?.reason).toMatch(/no held credential/i);
    });

    /* ---- additionally blocked: SD-JWT-VC presentation in the plugin ---- */

    /**
     * **SKIPPED** — Gap 1 in this file's docstring. Even with OID4VP
     * 1.0 client-id-prefix support, a full roundtrip requires the
     * plugin to *emit* SD-JWT-VC presentations with KB-JWT signing.
     * The plugin currently only emits W3C `jwt_vc_json` / `ldp_vp`
     * envelopes, which EUDI rejects with `UnsupportedFormat`.
     *
     * `requestW3cVc` is included here as a documentation hook —
     * a future `requestSdJwtVc` builder will mint sd-jwt-vc DCQL
     * queries the plugin can then satisfy.
     */
    it.skip('[blocked: plugin SD-JWT-VC presentation support] full roundtrip with EUDI verifies VP', async () => {
        // Placeholder for the eventual roundtrip test. The shape will
        // mirror sphereon-dcql-roundtrip.spec.ts:
        //   1. Issue SD-JWT-VC from a compatible issuer (TBD — walt.id
        //      issues SD-JWT-VC but we'd need to sign the
        //      KB-JWT during presentation).
        //   2. Plugin presents via DCQL with format=dc+sd-jwt.
        //   3. EUDI's /wallet/direct_post accepts.
        //   4. EUDI's /ui/presentations/<txn> reports verified=true.
        const _placeholder = requestW3cVc({
            id: 'placeholder',
            types: ['VerifiableCredential'],
        });
        expect(_placeholder).toBeDefined();
    });
});
