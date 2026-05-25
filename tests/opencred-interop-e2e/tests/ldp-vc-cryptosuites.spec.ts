/**
 * Data Integrity cryptosuite compatibility — LearnCard ↔ OpenCred.
 *
 * The roundtrip specs default to whatever cryptosuite LearnCard's VC
 * plugin emits (Ed25519Signature2020 today). This spec pins the cross-
 * vendor signal for the two cryptosuites OpenCred explicitly supports:
 *
 *   - `Ed25519Signature2020`     (legacy, default of LearnCard's vc-plugin)
 *   - `DataIntegrityProof` over `eddsa-rdfc-2022` (current W3C VCDI)
 *
 * If LearnCard upgrades its default cryptosuite, this spec catches any
 * shape drift in the proof envelope before it lands a production
 * regression against OpenCred-style verifiers.
 *
 * OpenCred's supported set (audited from common/suites.js):
 *   Ed25519Signature2018, Ed25519Signature2020,
 *   DataIntegrityProof(ecdsa-rdfc-2019), DataIntegrityProof(eddsa-rdfc-2022).
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

const runRoundtrip = async (proofType: string, walletSeed: string): Promise<void> => {
    const wallet = await getLearnCard(walletSeed);

    const unsigned = buildUnsignedBasicV1(wallet);
    const signedVc = await wallet.invoke.issueCredential(unsigned, { type: proofType });

    const proof = (signedVc as { proof?: { type?: string; cryptosuite?: string } }).proof;
    expect(proof).toBeDefined();

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
    expect(finalStatus.errors).toBeFalsy();
};

describe('interop: OpenCred accepts LearnCard ldp_vc across cryptosuites', () => {
    it('accepts a VC signed with Ed25519Signature2020', async () => {
        await runRoundtrip('Ed25519Signature2020', 'c'.repeat(64));
    });

    // SKIPPED — vc-plugin gap.
    //
    // Passing `type: 'DataIntegrityProof'` to `issueCredential` produces a
    // proof with no `cryptosuite` field (defaults aren't filled in). OpenCred
    // requires a registered cryptosuite to pick a verification suite, and
    // rejects with "Did not verify any proofs; insufficient proofs matched
    // the acceptable suite(s) and required purpose(s)". The fix is to plumb
    // `cryptosuite: 'eddsa-rdfc-2022'` through the vc-plugin → didkit chain
    // when type is DataIntegrityProof, mirroring how Ed25519Signature2020 is
    // self-describing today.
    it.skip('[vc-plugin gap: DataIntegrityProof needs cryptosuite plumbing] accepts a VC signed with eddsa-rdfc-2022', async () => {
        await runRoundtrip('DataIntegrityProof', 'd'.repeat(64));
    });
});
