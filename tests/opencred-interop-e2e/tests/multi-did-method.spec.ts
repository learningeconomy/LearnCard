/**
 * Multi-DID method roundtrip — LearnCard ↔ OpenCred.
 *
 * OpenCred's resolver supports `did:key`, `did:jwk`, and `did:web` for
 * credential issuers and VP holders (audited from
 * common/documentLoader.js). LearnCard's default holder identity is
 * `did:key:z6Mk...`. This spec proves the canonical roundtrip for the
 * default DID method.
 *
 * Note: did:web roundtrip is intentionally out of scope here because
 * exercising it requires the wallet's holder DID document to be
 * resolvable FROM the OpenCred container — meaning brain-service (or a
 * stand-in did:web host) must be reachable on the docker network. The
 * walt.id suite solves this with a `host-bridge` socat sidecar; adding
 * an analogous sidecar for did:web holders is a follow-up slice if
 * production wallets emit did:web identities at scale.
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

describe('interop: OpenCred accepts LearnCard holder identities', () => {
    it('accepts a did:key holder identity', async () => {
        const wallet = await getLearnCard('1234567890abcdef'.repeat(4));

        expect(wallet.id.did()).toMatch(/^did:key:/);

        const unsigned = buildUnsignedBasicV1(wallet);
        const signedVc = await wallet.invoke.issueCredential(unsigned);

        const exchange = await createExchange({
            opencredBaseUrl: OPENCRED_BASE_URL,
            workflowId: WORKFLOW_ID,
            clientSecret: CLIENT_SECRET,
        });

        const authRequestUri = await inlineRequestUri(exchange.OID4VP!);
        const resolved = await wallet.invoke.resolveAuthorizationRequest(authRequestUri);
        const pd = resolved.presentation_definition as {
            input_descriptors: Array<{ id: string }>;
        };

        const present = await wallet.invoke.presentCredentials(authRequestUri, [
            {
                descriptorId: pd.input_descriptors[0]!.id,
                candidate: { credential: signedVc, format: 'ldp_vc' as const },
            },
        ]);

        expect(present.submitted.status).toBeGreaterThanOrEqual(200);
        expect(present.submitted.status).toBeLessThan(400);

        const finalStatus = await waitForExchangeComplete(
            OPENCRED_BASE_URL,
            WORKFLOW_ID,
            exchange.exchangeId,
            exchange.accessToken
        );

        expect(finalStatus.state).toBe('complete');
    });

    it.skip('[follow-up: needs did:web host-bridge sidecar] accepts a did:web holder identity', async () => {
        expect(true).toBe(true);
    });
});
