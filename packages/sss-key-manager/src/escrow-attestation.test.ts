import { beforeAll, describe, expect, it } from 'vitest';
import { generateEscrowKeyPair } from './escrow-crypto';
import { verifyEnclaveAttestation } from './escrow-attestation';

describe('verifyEnclaveAttestation', () => {
    let publicKey: string;
    beforeAll(async () => {
        publicKey = (await generateEscrowKeyPair()).publicKey;
    });
    const attestation = () => ({
        mode: 'software',
        keyId: 'test-key',
        publicKey,
        measurements: {},
        document: 'e30=',
        issuedAt: new Date().toISOString(),
    });

    it('accepts a pinned software key with surrounding whitespace', async () => {
        await expect(
            verifyEnclaveAttestation(
                { ...attestation(), publicKey: ` ${publicKey}\n` },
                { mode: 'software', pinnedPublicKeys: [`\n${publicKey} `] }
            )
        ).resolves.toEqual({ mode: 'software', keyId: 'test-key', publicKey });
    });
    it('rejects an unknown key', async () => {
        await expect(
            verifyEnclaveAttestation(attestation(), {
                mode: 'software',
                pinnedPublicKeys: [(await generateEscrowKeyPair()).publicKey],
            })
        ).rejects.toThrow('not trusted');
    });
    it('rejects nitro under software policy', async () => {
        await expect(
            verifyEnclaveAttestation(
                { ...attestation(), mode: 'nitro' },
                { mode: 'software', pinnedPublicKeys: [publicKey] }
            )
        ).rejects.toThrow('mode mismatch');
    });
    it.each(['software', 'nitro'])(
        'fails closed under nitro policy (%s attestation)',
        async mode => {
            await expect(
                verifyEnclaveAttestation(
                    { ...attestation(), mode },
                    { mode: 'nitro', pinnedMeasurements: [] }
                )
            ).rejects.toThrow('Nitro attestation verification is not implemented yet');
        }
    );
    it.each([
        { publicKey: 'e30=' },
        { publicKey: 'not-base64' },
        { keyId: 'invalid/key' },
        { mode: 'unknown' },
        { measurements: [] },
        { measurements: { unknown: 'value' } },
        { document: 3 },
        { issuedAt: 'not-a-date' },
        { extra: true },
    ])('rejects malformed attestation %j', async overrides => {
        await expect(
            verifyEnclaveAttestation(
                { ...attestation(), ...overrides },
                { mode: 'software', pinnedPublicKeys: [publicKey] }
            )
        ).rejects.toThrow();
    });
    it('rejects SPKI on another curve', async () => {
        const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-384' }, true, [
            'deriveBits',
        ]);
        const spki = await crypto.subtle.exportKey('spki', pair.publicKey);
        const key = btoa(String.fromCharCode(...new Uint8Array(spki)));
        await expect(
            verifyEnclaveAttestation(
                { ...attestation(), publicKey: key },
                { mode: 'software', pinnedPublicKeys: [key] }
            )
        ).rejects.toThrow();
    });
});
