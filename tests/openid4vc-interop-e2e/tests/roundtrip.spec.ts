/**
 * Interop — **full round trip** against a real walt.id stack.
 *
 *   1. walt.id issuer mints a pre-auth credential offer
 *   2. plugin.acceptCredentialOffer → real JWT-VC signed by walt.id
 *   3. walt.id verifier creates a verify session asking for that VC
 *   4. plugin.presentCredentials → JWT-VP signed by the holder
 *   5. walt.id verifier runs its verification policies, returns
 *      `verificationResult: true`
 *
 * This is the **ground-truth interop test** — the in-process e2e
 * suite proves the plugin is internally consistent, but this spec
 * is what catches spec-drift between our wallet-side implementation
 * and a widely-deployed third-party stack.
 */
import { describe, expect, it } from 'vitest';
import { decodeJwt, decodeProtectedHeader } from 'jose';

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

describe('interop: walt.id → plugin → walt.id round trip', () => {
    it('issues with walt.id, presents back to walt.id, verifier accepts', async () => {
        const mock = await buildMockLearnCard();
        const plugin = getPlugin(mock);

        // --- 1. walt.id mints a pre-auth offer ---
        const issuerKey = await createIssuerKey();

        const rawOfferUri = await mintWaltidOffer({
            issuerBaseUrl: ISSUER_BASE_URL,
            issuerKey,
        });
        const offerUri = await resolveOfferToByValue(rawOfferUri);

        // --- 2. Plugin accepts the offer, receives JWT-VC ---
        const acceptResult = await plugin.acceptCredentialOffer(offerUri);

        expect(acceptResult.credentials).toHaveLength(1);

        const credentialEntry = acceptResult.credentials[0];
        expect(credentialEntry.format).toBe('jwt_vc_json');

        const vcJwt: string = credentialEntry.credential;
        const vcPayload = decodeJwt(vcJwt);
        expect(vcPayload.iss).toBe(issuerKey.did);
        expect(vcPayload.sub).toBe(mock.did);

        // Sanity — the credential's header algorithm should match
        // what walt.id's metadata advertised.
        expect(decodeProtectedHeader(vcJwt).alg).toBe('EdDSA');

        // --- 3. walt.id verifier opens a verify session for that VC ---
        const session = await createWaltidVerifySession({
            verifierBaseUrl: VERIFIER_BASE_URL,
            requestCredentials: [
                { type: 'UniversityDegree', format: 'jwt_vc_json' },
            ],
        });

        const authRequestUri = await resolveAuthorizationRequestToByValue(
            session.authorizationRequestUri
        );

        // --- 4. Plugin presents the credential back to walt.id ---
        const resolvedRequest = await plugin.resolveAuthorizationRequest(authRequestUri);
        const pd = resolvedRequest.presentation_definition as {
            input_descriptors: Array<{ id: string }>;
        };

        // Map the newly-issued credential to walt.id's input descriptor.
        const chosen = [
            {
                descriptorId: pd.input_descriptors[0]!.id,
                candidate: {
                    credential: vcJwt,
                    format: 'jwt_vc_json' as const,
                },
            },
        ];

        const present = await plugin.presentCredentials(authRequestUri, chosen);

        // The plugin's `submitted` carries walt.id's HTTP response.
        expect(present.submitted).toBeDefined();
        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        // --- 5. Confirm walt.id's verifier accepted the presentation ---
        const status = await waitForVerifyResult(VERIFIER_BASE_URL, session.state);
        expect(status.verificationResult).toBe(true);
    });
});
