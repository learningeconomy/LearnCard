/**
 * Interop — **strict nonce + audience binding** against Sphereon.
 *
 * These are the tests walt.id couldn't run for us (its verifier
 * is empirically lax on nonce binding — see Tier 1's negative spec
 * and the "walt.id quirks" section of the README). The strict
 * Sphereon-PEX verifier built in `setup/sphereon-verifier.ts`
 * enforces both checks, so we can finally prove the plugin's VP
 * JWT carries the correct `nonce` and `aud` claims session-by-session.
 *
 * Test design — for each scenario we:
 *
 *   1. Issue a real walt.id-signed VC so the inner credential is
 *      legit (we want the failure to land at the binding check, not
 *      at signature verification).
 *   2. Mint two distinct Sphereon sessions on the same verifier
 *      with deliberately-divergent properties (nonces and/or
 *      audiences).
 *   3. Have the plugin present to session A — that's the genuine
 *      flow, the VP gets nonce_A + aud_A baked into the JWT.
 *   4. Replay the *same signed VP* to session B's `/direct_post`
 *      with `state` rewritten to point at session B. Sphereon
 *      looks up B, compares, and rejects.
 *
 * The replay uses raw `fetch` rather than the plugin so we can
 * forge the `state` field — wallets in production never do this,
 * but adversaries do, and the verifier is what stands between the
 * two.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import {
    createIssuerKey,
    mintWaltidOffer,
    resolveOfferToByValue,
} from '../setup/walt-id-client';
import {
    startSphereonVerifier,
    type SphereonVerifier,
} from '../setup/sphereon-verifier';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const ISSUER_BASE_URL = process.env.WALTID_ISSUER_BASE_URL ?? 'http://localhost:7002';

const getPlugin = (mock: MockLearnCardHandle) => {
    const plugin = getOpenID4VCPlugin(mock.learnCard, {});
    const bound: Record<string, (...args: any[]) => any> = {};
    for (const [name, fn] of Object.entries(plugin.methods)) {
        bound[name] = (...args: any[]) =>
            (fn as (...a: any[]) => any)(mock.learnCard, ...args);
    }
    return bound as any;
};

const universityDegreePD = {
    id: 'sphereon-strict-pd',
    input_descriptors: [
        {
            id: 'university_degree_descriptor',
            constraints: {
                fields: [
                    {
                        path: ['$.vc.type[*]', '$.type[*]'],
                        filter: { type: 'string', const: 'UniversityDegree' },
                    },
                ],
            },
        },
    ],
};

/**
 * Inline mirror of the plugin's `encodeFormBody` from `vp/submit.ts`.
 * Re-implemented here (and in `negative.spec.ts`) so the harness can
 * forge `state` without monkey-patching plugin internals. Keep these
 * two copies in lockstep until we extract a shared test helper.
 */
const encodeFormBody = (args: {
    vpToken: unknown;
    submission: unknown;
    state: string;
}): string => {
    const params = new URLSearchParams();
    params.set(
        'vp_token',
        typeof args.vpToken === 'string' ? args.vpToken : JSON.stringify(args.vpToken)
    );
    params.set('presentation_submission', JSON.stringify(args.submission));
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

describe('interop: Sphereon strict nonce + audience binding', () => {
    let sphereon: SphereonVerifier;

    beforeAll(async () => {
        sphereon = await startSphereonVerifier();
    });

    afterAll(async () => {
        await sphereon.stop();
    });

    /* ---------------------------- nonce ----------------------------------- */

    it('rejects a VP whose nonce was minted for a different session', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        // Same audience on both sessions so only the nonce differs;
        // that pins the rejection reason to nonce binding alone.
        const sessionA = sphereon.createSession({
            presentationDefinition: universityDegreePD,
            audience: 'sphereon-shared-audience',
        });
        const sessionB = sphereon.createSession({
            presentationDefinition: universityDegreePD,
            audience: 'sphereon-shared-audience',
        });
        expect(sessionA.nonce).not.toBe(sessionB.nonce);

        // 1) Plugin presents to session A — genuine flow.
        const presentA = await plugin.presentCredentials(sessionA.authorizationRequestUri, [
            {
                descriptorId: 'university_degree_descriptor',
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        expect(presentA.submitted.status).toBe(200);
        expect(sphereon.getStatus(sessionA.state).verificationResult).toBe(true);

        // 2) Replay the SAME signed VP to session B by forging `state`.
        const replayBody = encodeFormBody({
            vpToken: presentA.signed.vpToken,
            submission: presentA.prepared.submission,
            state: sessionB.state,
        });

        const replay = await fetch(`${sphereon.baseUrl}/direct_post`, {
            method: 'POST',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            body: replayBody,
        });

        // 3) Strict rejection: 400 + precise reason in errors[].
        expect(replay.status).toBe(400);

        const replayBody_json = (await replay.json()) as { error?: string };
        expect(replayBody_json.error).toMatch(/nonce mismatch/i);

        const statusB = sphereon.getStatus(sessionB.state);
        expect(statusB.verificationResult).toBe(false);
        expect(statusB.errors.some(e => /nonce mismatch/i.test(e))).toBe(true);
    });

    /* --------------------------- audience --------------------------------- */

    it('rejects a VP whose audience was minted for a different verifier', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        // Same nonce, different audiences. Once we replay, the
        // verifier sees nonce-OK, audience-mismatched, and the
        // rejection lands precisely on the audience check.
        const sharedNonce = 'shared-nonce-for-audience-test';
        const sessionA = sphereon.createSession({
            presentationDefinition: universityDegreePD,
            nonce: sharedNonce,
            audience: 'sphereon-verifier-A',
        });
        const sessionB = sphereon.createSession({
            presentationDefinition: universityDegreePD,
            nonce: sharedNonce,
            audience: 'sphereon-verifier-B',
        });
        expect(sessionA.clientId).not.toBe(sessionB.clientId);
        expect(sessionA.nonce).toBe(sessionB.nonce);

        // 1) Genuine flow into A.
        const presentA = await plugin.presentCredentials(sessionA.authorizationRequestUri, [
            {
                descriptorId: 'university_degree_descriptor',
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        expect(presentA.submitted.status).toBe(200);
        expect(sphereon.getStatus(sessionA.state).verificationResult).toBe(true);

        // 2) Replay to B.
        const replayBody = encodeFormBody({
            vpToken: presentA.signed.vpToken,
            submission: presentA.prepared.submission,
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

    /* ----------------- positive: confirm strict mode is real --------------- */

    it('accepts a clean VP — proves the strict checks gate on real failures, not on baseline behavior', async () => {
        // This is the foil to the two negative tests above. Without
        // it, a regression that hardcodes the strict checks to always
        // reject (or always pass) would only show up in production.
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const vc = await issueWaltidUniversityDegree(plugin);

        const session = sphereon.createSession({
            presentationDefinition: universityDegreePD,
        });

        const present = await plugin.presentCredentials(session.authorizationRequestUri, [
            {
                descriptorId: 'university_degree_descriptor',
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        expect(present.submitted.status).toBe(200);

        const status = sphereon.getStatus(session.state);
        expect(status.errors).toEqual([]);
        expect(status.verificationResult).toBe(true);
    });
});
