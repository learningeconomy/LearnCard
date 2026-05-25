/**
 * OID4VP Draft 18 roundtrip — LearnCard ↔ OpenCred.
 *
 * Ground-truth interop signal: a credential issued by LearnCard and
 * presented through LearnCard's openid4vc plugin is accepted by
 * OpenCred's native OID4VP draft 18 workflow.
 *
 * Flow:
 *   1. OpenCred mints an exchange (Basic auth)
 *   2. Returned `OID4VP` URI is openid4vp://authorize?...
 *   3. LearnCard resolves the request — including verifying OpenCred's
 *      did:web signed Request Object via its `/.well-known/did.json`
 *   4. LearnCard issues an OpenBadge LD-VC to itself
 *   5. LearnCard's selector matches the held VC against the PD
 *   6. LearnCard signs and submits the VP
 *   7. Test polls until OpenCred's exchange state flips to `complete`
 *
 * If any step deviates from the spec, OpenCred rejects the submission
 * and the exchange state ends `invalid`. That's the regression signal.
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
const WORKFLOW_ID = 'lc-draft18-ldp';
const CLIENT_SECRET = 'lc-interop-secret';

describe('interop: OpenCred OID4VP Draft 18 roundtrip (ldp_vc)', () => {
    it('LearnCard-issued OpenBadge LD-VC is accepted by OpenCred', async () => {
        const wallet = await getLearnCard('a'.repeat(64));

        const unsigned = buildUnsignedBasicV1(wallet);
        const signedVc = await wallet.invoke.issueCredential(unsigned);

        expect(signedVc).toBeDefined();
        expect((signedVc as { proof?: unknown }).proof).toBeDefined();

        const exchange = await createExchange({
            opencredBaseUrl: OPENCRED_BASE_URL,
            workflowId: WORKFLOW_ID,
            clientSecret: CLIENT_SECRET,
        });

        expect(exchange.OID4VP).toBeDefined();
        expect(exchange.OID4VP).toMatch(/^openid4vp:\/\//);

        const authRequestUri = await inlineRequestUri(exchange.OID4VP!);

        const resolved = await wallet.invoke.resolveAuthorizationRequest(authRequestUri);
        expect(resolved.client_id).toBeDefined();
        expect(resolved.nonce).toBeDefined();
        expect(resolved.response_uri).toBeDefined();
        expect(resolved.presentation_definition).toBeDefined();

        const pd = resolved.presentation_definition as {
            id: string;
            input_descriptors: Array<{ id: string }>;
        };
        expect(pd.input_descriptors.length).toBeGreaterThan(0);

        const chosen = [
            {
                descriptorId: pd.input_descriptors[0]!.id,
                candidate: {
                    credential: signedVc,
                    format: 'ldp_vc' as const,
                },
            },
        ];

        const present = await wallet.invoke.presentCredentials(authRequestUri, chosen);

        expect(present.submitted).toBeDefined();
        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        const finalStatus = await waitForExchangeComplete(
            OPENCRED_BASE_URL,
            WORKFLOW_ID,
            exchange.exchangeId,
            exchange.accessToken
        );

        expect(finalStatus.state).toBe('complete');
        expect(finalStatus.errors).toBeFalsy();
    });
});
