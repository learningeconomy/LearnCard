/**
 * Negative interop signals — OpenCred MUST reject bad credentials.
 *
 * The positive specs prove "valid credential is accepted". These tests
 * prove the dual: "invalid credential is rejected". Without negative
 * coverage, a verifier that just rubber-stamps everything would still
 * pass the positive specs.
 *
 * Each test:
 *   1. Issues a real credential
 *   2. Mutates it to make it invalid (tamper signature, expire, strip a
 *      required field)
 *   3. Presents the mutated credential to OpenCred
 *   4. Asserts OpenCred's exchange state ends `invalid` — either at
 *      submission boundary (HTTP non-2xx) OR via the post-submit verify
 *      pipeline (state=invalid with errors).
 *
 * Different rejection modes both count as success — what matters is
 * "credential not accepted".
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

const presentAndExpectRejection = async (
    walletSeed: string,
    mutator: (vc: unknown) => unknown
): Promise<void> => {
    const wallet = await getLearnCard(walletSeed);

    const unsigned = buildUnsignedBasicV1(wallet);
    const signedVc = await wallet.invoke.issueCredential(unsigned);
    const mutated = mutator(signedVc);

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

    let submitFailedAtBoundary = false;
    try {
        const present = await wallet.invoke.presentCredentials(authRequestUri, [
            {
                descriptorId: pd.input_descriptors[0]!.id,
                candidate: { credential: mutated, format: 'ldp_vc' as const },
            },
        ]);
        if (present.submitted.status >= 400) {
            submitFailedAtBoundary = true;
        }
    } catch {
        submitFailedAtBoundary = true;
    }

    if (submitFailedAtBoundary) {
        return;
    }

    const finalStatus = await waitForExchangeComplete(
        OPENCRED_BASE_URL,
        WORKFLOW_ID,
        exchange.exchangeId,
        exchange.accessToken
    );

    expect(finalStatus.state).toBe('invalid');
};

const tamperLdProof = (vc: unknown): unknown => {
    const cloned = JSON.parse(JSON.stringify(vc)) as {
        proof?: { jws?: string; proofValue?: string };
    };
    if (cloned.proof?.jws) {
        const parts = cloned.proof.jws.split('.');
        if (parts.length === 3 && parts[2]!.length > 4) {
            const sig = parts[2]!;
            const idx = Math.floor(sig.length / 2);
            parts[2] = sig.slice(0, idx) + (sig[idx] === 'A' ? 'B' : 'A') + sig.slice(idx + 1);
            cloned.proof.jws = parts.join('.');
        }
    } else if (cloned.proof?.proofValue) {
        const v = cloned.proof.proofValue;
        const idx = Math.floor(v.length / 2);
        cloned.proof.proofValue = v.slice(0, idx) + (v[idx] === 'a' ? 'b' : 'a') + v.slice(idx + 1);
    }
    return cloned;
};

const stripIssuer = (vc: unknown): unknown => {
    const cloned = JSON.parse(JSON.stringify(vc)) as Record<string, unknown>;
    delete cloned.issuer;
    return cloned;
};

const setPastExpirationDate = (vc: unknown): unknown => {
    const cloned = JSON.parse(JSON.stringify(vc)) as Record<string, unknown>;
    cloned.expirationDate = '2000-01-01T00:00:00Z';
    cloned.validUntil = '2000-01-01T00:00:00Z';
    return cloned;
};

describe('interop: OpenCred rejects invalid credentials', () => {
    it('rejects a credential with a tampered proof signature', async () => {
        await presentAndExpectRejection('1'.repeat(64), tamperLdProof);
    });

    it('rejects a credential missing the required `issuer` field', async () => {
        await presentAndExpectRejection('2'.repeat(64), stripIssuer);
    });

    it('rejects a credential whose expirationDate is in the past', async () => {
        await presentAndExpectRejection('3'.repeat(64), setPastExpirationDate);
    });
});
