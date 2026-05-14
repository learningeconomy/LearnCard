/**
 * Interop — **cross-vendor DCQL roundtrip**: walt.id issues, plugin
 * holds, Sphereon strictly verifies via the `dcql` library's
 * presentation-result matcher.
 *
 * Sibling of `sphereon-roundtrip.spec.ts` (PEX) — same structure,
 * different query language. Together they prove the plugin's routing
 * layer (Slice 6) handles BOTH OID4VP query languages end-to-end with
 * a single API call (`presentCredentials`), and that the resulting
 * wire-level submissions are independently validatable by a strict
 * spec-compliant verifier.
 *
 * If the plugin had quietly diverged from spec on either side
 * (descriptor_map paths for PEX, vp_token object keying for DCQL),
 * one of the two roundtrip tests would fail while the other passed
 * — surfacing the regression at exactly the right level.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { getOpenID4VCPlugin, requestW3cVc } from '@learncard/openid4vc-plugin';

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

describe('interop: cross-vendor DCQL roundtrip (walt.id issues → Sphereon DCQL verifies)', () => {
    let sphereon: SphereonVerifier;

    beforeAll(async () => {
        sphereon = await startSphereonVerifier();
    });

    afterAll(async () => {
        await sphereon.stop();
    });

    it('walt.id-issued VC presented through DCQL pipeline passes Sphereon strict matcher', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // --- Phase 1: walt.id issues a credential (same as the PEX test) ---
        const issuerKey = await createIssuerKey();
        const offerRaw = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
        });
        const offer = await resolveOfferToByValue(offerRaw);
        const accepted = await plugin.acceptCredentialOffer(offer);
        const vc: string = accepted.credentials[0].credential;

        // --- Phase 2: Sphereon mints a DCQL session ---
        // The verifier composer (slice 7) builds the query from
        // domain-shaped intent. Same query is stored on the session
        // and embedded in the auth-request URI.
        const dcqlQuery = requestW3cVc({
            id: 'degree',
            types: ['VerifiableCredential', 'UniversityDegree'],
        });

        const session = sphereon.createSession({
            dcqlQuery: dcqlQuery as unknown as Record<string, unknown>,
        });

        // --- Phase 3: plugin auto-routes to DCQL pipeline ---
        const resolved = await plugin.resolveAuthorizationRequest(
            session.authorizationRequestUri
        );
        expect(resolved.dcql_query).toBeDefined();
        expect(resolved.presentation_definition).toBeUndefined();

        const present = await plugin.presentCredentials(session.authorizationRequestUri, [
            {
                credentialQueryId: 'degree',
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        // The plugin took the DCQL route — verify the return shape.
        expect(present.dcqlBuilt).toBeDefined();
        expect(present.dcqlSigned).toBeDefined();
        expect(present.dcqlVpToken).toEqual(
            expect.objectContaining({ degree: expect.any(String) })
        );
        expect(present.prepared).toBeUndefined(); // PEX field stays unset.
        expect(present.signed).toBeUndefined();

        // The submission reached Sphereon and passed every strict
        // check (signature, nonce, audience, dcql.DcqlPresentationResult).
        expect(present.submitted.status).toBe(200);

        const status = sphereon.getStatus(session.state);
        expect(status.errors).toEqual([]);
        expect(status.verificationResult).toBe(true);
    });
});
