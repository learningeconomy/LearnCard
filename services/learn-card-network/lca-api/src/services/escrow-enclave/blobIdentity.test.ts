import { describe, expect, it } from 'vitest';
import vectors from '../../../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json';
import { escrowBlobIdentity } from './blobIdentity';

const P256_P = BigInt('0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff');

const negatePoint = (base64: string): string => {
    const point = Buffer.from(base64, 'base64');
    const y = BigInt(`0x${point.subarray(33).toString('hex')}`);
    const negated = Buffer.from((P256_P - y).toString(16).padStart(64, '0'), 'hex');
    return Buffer.concat([point.subarray(0, 33), negated]).toString('base64');
};

describe('escrowBlobIdentity', () => {
    const [first] = vectors.blobs;
    if (!first) throw new Error('escrow-vectors.json has no blobs');
    const { envelope } = first;

    it('matches the enclave golden vector', () => {
        expect(escrowBlobIdentity(envelope)).toBe(
            '8090217ef11060bfa380c4a4b26d76a64811216176ecb60749652fabf3b09425'
        );
    });

    it('is unchanged when the ephemeral point is negated', () => {
        const twin = { ...envelope, ephemeralPublicKey: negatePoint(envelope.ephemeralPublicKey) };
        expect(twin.ephemeralPublicKey).not.toBe(envelope.ephemeralPublicKey);
        expect(escrowBlobIdentity(twin)).toBe(escrowBlobIdentity(envelope));
    });

    it('changes when the ciphertext changes', () => {
        const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
        ciphertext.writeUInt8(ciphertext.readUInt8(0) ^ 1, 0);
        expect(
            escrowBlobIdentity({ ...envelope, ciphertext: ciphertext.toString('base64') })
        ).not.toBe(escrowBlobIdentity(envelope));
    });

    it('rejects malformed envelopes', () => {
        expect(() => escrowBlobIdentity({ ...envelope, ephemeralPublicKey: 'BA==' })).toThrow();
    });
});
