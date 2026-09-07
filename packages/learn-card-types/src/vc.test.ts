import { expect, test } from 'vitest';
import { ProofValidator } from './vc';

test('only final ecdsa-rdfc-2019 DataIntegrityProofs may omit created', () => {
    const proof = {
        type: 'DataIntegrityProof',
        cryptosuite: 'ecdsa-rdfc-2019',
        proofPurpose: 'authentication',
        verificationMethod: 'did:example:holder#key',
        proofValue: 'zSignature',
    };

    expect(ProofValidator.parse(proof)).toEqual(proof);
    const legacy = { ...proof, cryptosuite: 'eddsa-rdfc-2022' };
    expect(ProofValidator.safeParse(legacy).success).toBe(false);
    expect(ProofValidator.safeParse({ ...legacy, created: '2026-01-01T00:00:00Z' }).success).toBe(
        true
    );
    expect(ProofValidator.safeParse({ ...proof, type: 'Ed25519Signature2018' }).success).toBe(
        false
    );
    expect(ProofValidator.safeParse({ ...proof, created: null }).success).toBe(false);
});
