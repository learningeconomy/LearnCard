/**
 * Interop \u2014 **strict nonce + audience binding under DCQL**.
 *
 * The DCQL counterpart to `sphereon-strict-binding.spec.ts` (which
 * covers the same checks for the PEX route). Both files exist
 * because the wire shapes differ:
 *
 *   - PEX: form body carries `vp_token` (single signed VP) +
 *     `presentation_submission` + `state`.
 *   - DCQL: form body carries `vp_token` (JSON object keyed by
 *     `credential_query_id`, values are per-query signed
 *     presentations) + `state`. NO `presentation_submission`.
 *
 * Without this spec, a regression that broke nonce / audience /
 * inner-VC binding for the DCQL path specifically (e.g., if the
 * plugin's DCQL response builder forgot to thread the verifier's
 * `nonce` claim into per-query JWT-VPs) would slip past the PEX
 * tests entirely. We need parity coverage on both routes.
 *
 * Test design mirrors the PEX file:
 *
 *   1. Issue a real walt.id-signed VC so the inner credential is
 *      legit \u2014 isolate the failure to the binding check.
 *   2. Mint two distinct Sphereon DCQL sessions on the same
 *      verifier with deliberately-divergent properties.
 *   3. Have the plugin present to session A (genuine flow).
 *   4. Replay the *same* signed DCQL `vp_token` to session B's
 *      `/direct_post` with `state` forged. Sphereon looks up B,
 *      compares per-query JWT-VPs, and rejects.
 *
 * The replay uses raw `fetch` rather than the plugin so we can
 * forge `state` \u2014 wallets in production never do this, but
 * adversaries do.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
    getOpenID4VCPlugin,
    requestW3cVc,
} from '@learncard/openid4vc-plugin';

import {
    createIssuerKey,
    mintWaltidOffer,
    resolveOfferToByValue,
    tamperJwtSignature,
} from '../setup/walt-id-client';
import {
    startSphereonVerifier,
    type SphereonVerifier,
} from '../setup/sphereon-verifier';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const ISSUER_BASE_URL = process.env.WALTID_ISSUER_BASE_URL ?? 'http://localhost:7002';

const QUERY_ID = 'university_degree_query';

const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

/**
 * Inline mirror of the plugin's DCQL form-body encoding. Re-emitted
 * here so the harness can forge `state` without monkey-patching
 * plugin internals. The DCQL shape is leaner than PEX:
 *
 *   - `vp_token` is a JSON object (per OID4VP 1.0 \u00a76.4) \u2014 we
 *     stringify it on the wire.
 *   - NO `presentation_submission` field; the keying carries
 *     routing implicitly.
 *
 * Keep in lockstep with `vp/submit.ts` until we extract a shared
 * test helper. The PEX equivalent lives in
 * `sphereon-strict-binding.spec.ts`; the duplication is
 * intentional \u2014 each file owns its replay shape.
 */
const encodeDcqlFormBody = (args: {
    vpToken: unknown;
    state: string;
}): string => {
    const params = new URLSearchParams();
    params.set(
        'vp_token',
        typeof args.vpToken === 'string' ? args.vpToken : JSON.stringify(args.vpToken)
    );
    params.set('state', args.state);
    return params.toString();
};

const issueWaltidUniversityDegree = async (plugin: any): Promise<string> => {
    const issuerKey = await createIssuerKey();
    const offerRaw = await mintWaltidOffer({
        issuerBaseUrl: ISSUER_BASE_URL,
        issuerKey,
    });
    const offer = await resolveOfferToByValue(offerRaw);
    const accepted = await plugin.acceptCredentialOffer(offer);
    return accepted.credentials[0].credential as string;
};

/**
 * Build the DCQL query for the test. Uses the plugin's verifier
 * composer (`requestW3cVc`) so the query shape matches what real
 * verifiers would emit \u2014 not a hand-rolled JSON object that might
 * drift from the spec wire format.
 */
const universityDegreeDcql = (): Record<string, unknown> =>
    requestW3cVc({
        id: QUERY_ID,
        types: ['UniversityDegree'],
    }) as unknown as Record<string, unknown>;

describe('interop: Sphereon strict nonce + audience binding (DCQL route)', () => {
    let sphereon: SphereonVerifier;

    beforeAll(async () => {
        sphereon = await startSphereonVerifier();
    });

    afterAll(async () => {
        await sphereon.stop();
    });

    /* ---------------------------- nonce ----------------------------------- */

    it('rejects a DCQL vp_token whose nonce was minted for a different session', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        // Same audience on both sessions so only the nonce differs;
        // pins the rejection reason to nonce binding alone.
        const sessionA = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
            audience: 'sphereon-shared-audience',
        });
        const sessionB = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
            audience: 'sphereon-shared-audience',
        });
        expect(sessionA.nonce).not.toBe(sessionB.nonce);

        // 1) Plugin presents to session A \u2014 genuine flow. The
        //    plugin auto-routes to its DCQL response builder
        //    because the resolved request carries `dcql_query`.
        const presentA = await plugin.presentCredentials(
            sessionA.authorizationRequestUri,
            [
                {
                    credentialQueryId: QUERY_ID,
                    candidate: { credential: vc, format: 'jwt_vc_json' as const },
                },
            ]
        );

        expect(presentA.submitted.status).toBe(200);
        expect(sphereon.getStatus(sessionA.state).verificationResult).toBe(true);

        // 2) Replay the SAME signed DCQL vp_token object to
        //    session B by forging `state`. The vp_token was
        //    signed with nonce_A baked into the inner JWT
        //    (`nonce` claim) \u2014 reusing it against B should fail
        //    Sphereon's per-query nonce check.
        const replayBody = encodeDcqlFormBody({
            vpToken: presentA.dcqlVpToken,
            state: sessionB.state,
        });

        const replay = await fetch(`${sphereon.baseUrl}/direct_post`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: replayBody,
        });

        // 3) Strict rejection: 400 + precise reason.
        expect(replay.status).toBe(400);

        const replayJson = (await replay.json()) as { error?: string };
        expect(replayJson.error).toMatch(/nonce mismatch/i);

        const statusB = sphereon.getStatus(sessionB.state);
        expect(statusB.verificationResult).toBe(false);
        expect(statusB.errors.some(e => /nonce mismatch/i.test(e))).toBe(true);
    });

    /* --------------------------- audience --------------------------------- */

    it('rejects a DCQL vp_token whose audience was minted for a different verifier', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        // Same nonce, different audiences. Replay sees nonce-OK,
        // audience-mismatched, lands precisely on the audience check.
        const sharedNonce = 'shared-nonce-for-dcql-audience-test';
        const sessionA = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
            nonce: sharedNonce,
            audience: 'sphereon-dcql-verifier-A',
        });
        const sessionB = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
            nonce: sharedNonce,
            audience: 'sphereon-dcql-verifier-B',
        });
        expect(sessionA.clientId).not.toBe(sessionB.clientId);
        expect(sessionA.nonce).toBe(sessionB.nonce);

        // 1) Genuine flow into A.
        const presentA = await plugin.presentCredentials(
            sessionA.authorizationRequestUri,
            [
                {
                    credentialQueryId: QUERY_ID,
                    candidate: { credential: vc, format: 'jwt_vc_json' as const },
                },
            ]
        );

        expect(presentA.submitted.status).toBe(200);
        expect(sphereon.getStatus(sessionA.state).verificationResult).toBe(true);

        // 2) Replay to B.
        const replayBody = encodeDcqlFormBody({
            vpToken: presentA.dcqlVpToken,
            state: sessionB.state,
        });

        const replay = await fetch(`${sphereon.baseUrl}/direct_post`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: replayBody,
        });

        // 3) Strict rejection with audience-binding error.
        expect(replay.status).toBe(400);
        const replayJson = (await replay.json()) as { error?: string };
        expect(replayJson.error).toMatch(/audience mismatch/i);

        const statusB = sphereon.getStatus(sessionB.state);
        expect(statusB.verificationResult).toBe(false);
        expect(statusB.errors.some(e => /audience mismatch/i.test(e))).toBe(true);
    });

    /* --------------- tampered inner VC under DCQL responses --------------- */

    /**
     * Tampering the inner VC under DCQL is structurally identical
     * to PEX (each per-query JWT-VP wraps the same compact JWT-VC
     * we'd put inside a single-VP PEX response). The wallet builds
     * a fresh outer JWT-VP around the tampered inner VC; the
     * verifier's per-query inner-VC verification catches the
     * bit-flipped signature.
     *
     * This test guards against a future regression where the DCQL
     * response builder might skip the inner VC (e.g., if a refactor
     * accidentally removed the `verifiableCredential` wrapping).
     */
    it('rejects a DCQL vp_token whose inner VC signature was tampered', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);
        const tamperedVc = tamperJwtSignature(vc);

        expect(tamperedVc).not.toBe(vc);
        expect(tamperedVc.split('.').slice(0, 2)).toEqual(vc.split('.').slice(0, 2));

        const session = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
        });

        let submitFailed = false;
        try {
            await plugin.presentCredentials(session.authorizationRequestUri, [
                {
                    credentialQueryId: QUERY_ID,
                    candidate: { credential: tamperedVc, format: 'jwt_vc_json' as const },
                },
            ]);
        } catch (e) {
            submitFailed = true;
            const err = e as { status?: number; body?: { error?: string } };
            expect(err.status).toBe(400);
            expect(err.body?.error ?? '').toMatch(/signature/i);
        }

        expect(submitFailed).toBe(true);

        const status = sphereon.getStatus(session.state);
        expect(status.verificationResult).toBe(false);
        expect(
            status.errors.some(e => /signature/i.test(e) || /invalid/i.test(e))
        ).toBe(true);
    });

    /* ------ positive control: clean DCQL flow proves strict mode is real --- */

    it('accepts a clean DCQL vp_token \u2014 proves strict checks gate on real failures, not always-reject', async () => {
        // Foil to the negatives. Without this, a regression that
        // hardcoded "always reject DCQL" would only show in
        // production interop.
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        const session = sphereon.createSession({
            dcqlQuery: universityDegreeDcql(),
        });

        const present = await plugin.presentCredentials(session.authorizationRequestUri, [
            {
                credentialQueryId: QUERY_ID,
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        expect(present.submitted.status).toBe(200);

        const status = sphereon.getStatus(session.state);
        expect(status.errors).toEqual([]);
        expect(status.verificationResult).toBe(true);
    });
});
