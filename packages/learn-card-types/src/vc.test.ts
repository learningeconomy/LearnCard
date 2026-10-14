import { expect, test } from 'vitest';
import { ProofValidator } from './vc';

test.each(['ecdsa-rdfc-2019', 'ecdsa-jcs-2019', 'ecdsa-sd-2023'])(
    'final %s DataIntegrityProofs may omit created',
    cryptosuite => {
        const proof = {
            type: 'DataIntegrityProof',
            cryptosuite,
            proofPurpose: 'authentication',
            verificationMethod: 'did:example:holder#key',
            proofValue: 'zSignature',
        };

        expect(ProofValidator.parse(proof)).toEqual(proof);
        const legacy = { ...proof, cryptosuite: 'eddsa-rdfc-2022' };
        expect(ProofValidator.safeParse(legacy).success).toBe(false);
        expect(
            ProofValidator.safeParse({ ...legacy, created: '2026-01-01T00:00:00Z' }).success
        ).toBe(true);
        expect(ProofValidator.safeParse({ ...proof, type: 'Ed25519Signature2018' }).success).toBe(
            false
        );
        expect(ProofValidator.safeParse({ ...proof, created: null }).success).toBe(false);
    }
);

test('malformed final-suite proofs identify missing required fields rather than created', () => {
    const result = ProofValidator.safeParse({
        type: 'DataIntegrityProof',
        cryptosuite: 'ecdsa-rdfc-2019',
        proofPurpose: 'authentication',
        proofValue: 'zSignature',
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map(issue => issue.path)).toEqual([['verificationMethod']]);
});
