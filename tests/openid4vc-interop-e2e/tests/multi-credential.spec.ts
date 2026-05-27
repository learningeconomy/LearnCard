/**
 * Interop — **multi-credential PD** against walt.id.
 *
 * Proves the plugin can build a single VP that satisfies a
 * Presentation Definition with **two distinct input descriptors**,
 * each demanding a different credential type, and that walt.id's
 * verifier accepts both inside the same submission.
 *
 * This is a real wallet-side concern: every PD-driven request from a
 * relying party may ask for ≥1 credential, and the plugin's selector
 * + descriptor-map emission have to handle that without leaking
 * cross-descriptor mismatches.
 */
import { describe, expect, it } from 'vitest';

import { getOpenID4VCPlugin } from '@learncard/openid4vc-plugin';

import {
    createIssuerKey,
    createWaltidVerifySession,
    mintWaltidOffer,
    resolveAuthorizationRequestToByValue,
    resolveOfferToByValue,
    waitForVerifyResult,
} from '../setup/walt-id-client';
import { buildMockLearnCard, type MockLearnCardHandle } from './helpers/mock-learncard';

const ISSUER_BASE_URL = process.env.WALTID_ISSUER_BASE_URL ?? 'http://localhost:7002';
const VERIFIER_BASE_URL = process.env.WALTID_VERIFIER_BASE_URL ?? 'http://localhost:7003';

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
 * Pick the input descriptor whose `constraints.fields` filter
 * matches the given credential type. walt.id emits one descriptor
 * per `request_credentials` entry with a path filter on
 * `$.vc.type[*]` (or `$.type[*]`) that pattern-matches the type
 * name. Falls back to ordinal matching if walt.id's filter shape
 * has drifted.
 */
const findDescriptorForType = (
    pd: { input_descriptors: Array<Record<string, unknown>> },
    type: string,
    fallbackIndex: number
): string => {
    for (const descriptor of pd.input_descriptors) {
        const fields = (descriptor as any)?.constraints?.fields ?? [];
        const filterMentionsType = JSON.stringify(fields).includes(type);
        if (filterMentionsType && typeof descriptor.id === 'string') {
            return descriptor.id;
        }
    }

    const byOrdinal = pd.input_descriptors[fallbackIndex];
    if (byOrdinal && typeof byOrdinal.id === 'string') return byOrdinal.id;

    throw new Error(
        `No input_descriptor matched type=${type}; PD: ${JSON.stringify(pd)}`
    );
};

describe('interop: multi-credential Presentation Definition', () => {
    it('issues two distinct VCs from walt.id and presents both in one VP', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        const issuerKey = await createIssuerKey();

        // --- Issue credential 1: UniversityDegree ---
        const offer1Raw = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
            credentialConfigurationId: 'UniversityDegree_jwt_vc_json',
            credentialType: 'UniversityDegree',
            subjectClaims: {
                degree: { type: 'BachelorDegree', name: 'BSc Computing' },
            },
        });
        const offer1 = await resolveOfferToByValue(offer1Raw);
        const accepted1 = await plugin.acceptCredentialOffer(offer1);
        expect(accepted1.credentials).toHaveLength(1);
        const vc1: string = accepted1.credentials[0].credential;

        // --- Issue credential 2: OpenBadgeCredential ---
        // Different type, different shape — guarantees the selector
        // can't accidentally pass both descriptors with the same VC.
        const offer2Raw = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
            credentialConfigurationId: 'OpenBadgeCredential_jwt_vc_json',
            credentialType: 'OpenBadgeCredential',
            subjectClaims: {
                achievement: {
                    id: 'urn:uuid:open-badge-1',
                    name: 'Interop Test Badge',
                },
            },
        });
        const offer2 = await resolveOfferToByValue(offer2Raw);
        const accepted2 = await plugin.acceptCredentialOffer(offer2);
        expect(accepted2.credentials).toHaveLength(1);
        const vc2: string = accepted2.credentials[0].credential;

        // --- walt.id verifier asks for BOTH credentials ---
        const session = await createWaltidVerifySession({
            verifierBaseUrl: VERIFIER_BASE_URL,
            requestCredentials: [
                { type: 'UniversityDegree', format: 'jwt_vc_json' },
                { type: 'OpenBadgeCredential', format: 'jwt_vc_json' },
            ],
        });

        const authRequestUri = await resolveAuthorizationRequestToByValue(
            session.authorizationRequestUri
        );

        const resolved = await plugin.resolveAuthorizationRequest(authRequestUri);
        const pd = resolved.presentation_definition as {
            input_descriptors: Array<Record<string, unknown>>;
        };
        expect(pd.input_descriptors.length).toBeGreaterThanOrEqual(2);

        const universityDescriptorId = findDescriptorForType(pd, 'UniversityDegree', 0);
        const badgeDescriptorId = findDescriptorForType(pd, 'OpenBadgeCredential', 1);
        expect(universityDescriptorId).not.toBe(badgeDescriptorId);

        // --- Plugin builds + signs + submits the multi-credential VP ---
        const chosen = [
            {
                descriptorId: universityDescriptorId,
                candidate: { credential: vc1, format: 'jwt_vc_json' as const },
            },
            {
                descriptorId: badgeDescriptorId,
                candidate: { credential: vc2, format: 'jwt_vc_json' as const },
            },
        ];

        const present = await plugin.presentCredentials(authRequestUri, chosen);

        expect(present.submitted).toBeDefined();
        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        // --- walt.id verifies BOTH credentials, returns true ---
        const status = await waitForVerifyResult(VERIFIER_BASE_URL, session.state);
        expect(status.verificationResult).toBe(true);
    });
});
