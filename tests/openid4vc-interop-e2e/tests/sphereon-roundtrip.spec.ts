/**
 * Interop — **cross-vendor roundtrip**: walt.id issues, plugin holds,
 * Sphereon-PEX strictly verifies.
 *
 * The mirror of `roundtrip.spec.ts` but with a different verifier on
 * the receiving end. If our plugin had quietly absorbed any
 * walt.id-specific laxity (looser nonce binding, sloppy descriptor
 * map paths, off-by-one PEX submission shape), Sphereon's strict
 * evaluator would reject the VP where walt.id rubber-stamped it.
 *
 * The credential under test is walt.id-issued — that's the *point*,
 * not an accident. We're proving that a credential produced by one
 * vendor and held by our wallet is acceptable to a *different*
 * vendor's verifier. That's the interop-suite ground truth.
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

/**
 * A minimal PEX v2 Presentation Definition asking for any VC of
 * `type: UniversityDegree`. Mirrors what walt.id emits when its
 * verify endpoint is given `request_credentials: [{ type, format }]`.
 * We hand-roll it here so this spec is independent of walt.id's
 * verifier — if walt.id's verifier code path were broken, this
 * would still surface a Sphereon-side problem cleanly.
 */
const universityDegreePD = {
    id: 'sphereon-interop-pd-1',
    input_descriptors: [
        {
            id: 'university_degree_descriptor',
            name: 'University Degree',
            purpose: 'Cross-vendor interop test',
            constraints: {
                fields: [
                    {
                        path: ['$.vc.type[*]', '$.type[*]'],
                        filter: {
                            type: 'string',
                            const: 'UniversityDegree',
                        },
                    },
                ],
            },
        },
    ],
};

describe('interop: cross-vendor roundtrip (walt.id issues → Sphereon verifies)', () => {
    let sphereon: SphereonVerifier;

    beforeAll(async () => {
        sphereon = await startSphereonVerifier();
    });

    afterAll(async () => {
        await sphereon.stop();
    });

    it('walt.id-issued VC presented through our plugin passes Sphereon strict PEX validation', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // --- Phase 1: walt.id issues a credential ---
        const issuerKey = await createIssuerKey();
        const offerRaw = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
        });
        const offer = await resolveOfferToByValue(offerRaw);
        const accepted = await plugin.acceptCredentialOffer(offer);
        expect(accepted.credentials).toHaveLength(1);
        const vc: string = accepted.credentials[0].credential;

        // --- Phase 2: Sphereon mints a verify session ---
        const session = sphereon.createSession({
            presentationDefinition: universityDegreePD,
        });

        // --- Phase 3: plugin builds + signs + submits the VP ---
        const resolved = await plugin.resolveAuthorizationRequest(
            session.authorizationRequestUri
        );
        const pd = resolved.presentation_definition as {
            input_descriptors: Array<{ id: string }>;
        };
        expect(pd.input_descriptors[0]!.id).toBe('university_degree_descriptor');

        const present = await plugin.presentCredentials(session.authorizationRequestUri, [
            {
                descriptorId: 'university_degree_descriptor',
                candidate: { credential: vc, format: 'jwt_vc_json' as const },
            },
        ]);

        // Sphereon's verifier returns 200 OK for accepted submissions
        // and 400 for rejections; the plugin's submit helper throws
        // VpSubmitError on non-2xx, so reaching this assertion means
        // the strict server accepted us.
        expect(present.submitted.status).toBe(200);

        // --- Phase 4: Sphereon's strict verdict ---
        const status = sphereon.getStatus(session.state);
        expect(status.errors).toEqual([]);
        expect(status.verificationResult).toBe(true);
    });
});
