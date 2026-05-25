/**
 * Multi-credential roundtrip — LearnCard ↔ OpenCred.
 *
 * Exercises PEX with TWO input_descriptors. LearnCard's selector must
 * match the right credential to the right descriptor, and the resulting
 * `presentation_submission.descriptor_map` must point each entry at
 * the correct JSONPath within `verifiableCredential[]`.
 *
 * Common regressions this catches:
 *   - All descriptors matched to the first VC (path: $..verifiableCredential[0])
 *   - Descriptors silently merged when types overlap
 *   - Submission emitted with the wrong descriptor count
 */
import { describe, expect, it } from 'vitest';

import { getLearnCard } from './helpers/learncard';
import { buildUnsignedBasicV1 } from './helpers/fixtures';
import {
    createExchange,
    inlineRequestUri,
    waitForExchangeComplete,
} from '../setup/opencred-client';

const OPENCRED_BASE_URL = process.env.OPENCRED_BASE_URL ?? 'http://localhost:22080';
const CLIENT_SECRET = 'lc-interop-secret';

describe('interop: OpenCred multi-credential VP', () => {
    // SKIPPED — configuration impedance mismatch.
    //
    // OpenCred's `lc-multi-jwt` workflow requests two `input_descriptors`
    // each requiring `format: jwt_vc_json`. LearnCard's `issueCredential`
    // only emits ldp_vc (Data Integrity proofs) today — the jwt_vc_json
    // issuance path is tracked under credential-library Slice 5 in the
    // openid4vc plugin's roadmap. A future variant of this test can land
    // once jwt_vc_json issuance is wired through the vc-plugin (or a
    // walt.id-style manual JWT crafter is added to fixtures.ts).
    it.skip('[blocked: jwt_vc_json issuance support] LearnCard presents two distinct VCs in one VP, OpenCred verifies both', async () => {
        const wallet = await getLearnCard('e'.repeat(64));

        const unsignedA = buildUnsignedBasicV1(wallet);
        (unsignedA as { type: string[] }).type = [
            'VerifiableCredential',
            'UniversityDegreeCredential',
        ];
        const unsignedB = buildUnsignedBasicV1(wallet);
        (unsignedB as { type: string[] }).type = [
            'VerifiableCredential',
            'OpenBadgeCredential',
        ];

        const vcDegree = await wallet.invoke.issueCredential(unsignedA);
        const vcBadge = await wallet.invoke.issueCredential(unsignedB);

        const workflowId = 'lc-multi-jwt';

        const exchange = await createExchange({
            opencredBaseUrl: OPENCRED_BASE_URL,
            workflowId,
            clientSecret: CLIENT_SECRET,
        });

        const authRequestUri = await inlineRequestUri(exchange.OID4VP!);
        const resolved = await wallet.invoke.resolveAuthorizationRequest(authRequestUri);
        const pd = resolved.presentation_definition as {
            input_descriptors: Array<{ id: string; constraints?: unknown }>;
        };

        expect(pd.input_descriptors).toHaveLength(2);

        const chosen = pd.input_descriptors.map((descriptor, i) => ({
            descriptorId: descriptor.id,
            candidate: {
                credential: i === 0 ? vcDegree : vcBadge,
                format: 'ldp_vc' as const,
            },
        }));

        const present = await wallet.invoke.presentCredentials(authRequestUri, chosen);

        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        const finalStatus = await waitForExchangeComplete(
            OPENCRED_BASE_URL,
            workflowId,
            exchange.exchangeId,
            exchange.accessToken
        );

        expect(finalStatus.state).toBe('complete');
    });
});
