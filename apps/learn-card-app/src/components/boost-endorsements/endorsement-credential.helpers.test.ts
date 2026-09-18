import { describe, expect, it } from 'vitest';

import { resolveEndorsementTargetCredential } from './endorsement-credential.helpers';

describe('resolveEndorsementTargetCredential', () => {
    it('preserves an explicit credential id', async () => {
        const credential = { id: 'urn:uuid:credential-a' } as never;

        await expect(resolveEndorsementTargetCredential(credential)).resolves.toBe(credential);
    });

    it('derives a stable content id for an idless signed credential', async () => {
        const credential = {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiableCredential'],
            issuer: 'did:example:issuer',
            credentialSubject: { id: 'did:example:holder' },
            proof: { type: 'Ed25519Signature2020', proofValue: 'zExample' },
        };

        const firstTarget = await resolveEndorsementTargetCredential(credential as never);
        const secondTarget = await resolveEndorsementTargetCredential({
            ...credential,
            boostID: { backgroundImage: 'local-display-only' },
        } as never);

        expect(firstTarget.id).toMatch(/^urn:sha256:[0-9a-f]{64}$/);
        expect(secondTarget.id).toBe(firstTarget.id);
        expect(secondTarget).not.toHaveProperty('boostID');
    });
});
