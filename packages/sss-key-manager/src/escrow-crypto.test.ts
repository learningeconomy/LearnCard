import { beforeAll, describe, expect, it } from 'vitest';

import { base64ToBuffer, bufferToBase64 } from './crypto';
import {
    ESCROW_ALGORITHM,
    ESCROW_BLOB_INFO,
    ESCROW_CLIENT_KEY_ID,
    ESCROW_ENVELOPE_VERSION,
    ESCROW_RELEASE_INFO,
    decryptEscrowBlob,
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
    parseEscrowBlobPlaintext,
    parseEscrowEnvelope,
    parseEscrowReleasePlaintext,
    sealEscrowRelease,
} from './escrow-crypto';
import type { EscrowEnvelope } from './escrow-crypto';

const blob = {
    recoveryShare: `0001${'ab'.repeat(48)}`,
    did: 'did:key:zTestEscrow',
    shareVersion: 1,
};
const release = { ...blob, holdId: 'hold-1.test_2' };
const plaintext = { ...blob, version: 1 };
const releasePlaintext = { ...release, version: 1 };

describe('escrow encryption', () => {
    let publicKey = '';
    let privateKey = '';
    let wrongPrivateKey = '';
    let blobEnvelope: EscrowEnvelope;
    let releaseEnvelope: EscrowEnvelope;

    beforeAll(async (): Promise<void> => {
        ({ publicKey, privateKey } = await generateEscrowKeyPair());
        wrongPrivateKey = (await generateEscrowKeyPair()).privateKey;
        blobEnvelope = await encryptEscrowBlob(blob, publicKey, 'enclave-1');
        releaseEnvelope = await sealEscrowRelease(release, publicKey);
    });

    it('exports an importable SPKI/PKCS#8 P-256 key pair', async (): Promise<void> => {
        const importedPublic = await crypto.subtle.importKey(
            'spki',
            base64ToBuffer(publicKey),
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            []
        );
        const importedPrivate = await crypto.subtle.importKey(
            'pkcs8',
            base64ToBuffer(privateKey),
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
        );
        expect(importedPublic.type).toBe('public');
        expect(importedPrivate.type).toBe('private');
        const publicJwk = await crypto.subtle.exportKey('jwk', importedPublic);
        const privateJwk = await crypto.subtle.exportKey('jwk', importedPrivate);
        expect(privateJwk).toMatchObject({ crv: 'P-256', x: publicJwk.x, y: publicJwk.y });
    });

    it('round-trips blobs without exposing the recovery share', async (): Promise<void> => {
        expect(JSON.stringify(blobEnvelope)).not.toContain(blob.recoveryShare);
        expect(blobEnvelope).toMatchObject({
            version: ESCROW_ENVELOPE_VERSION,
            algorithm: ESCROW_ALGORITHM,
            keyId: 'enclave-1',
        });
        const point = base64ToBuffer(blobEnvelope.ephemeralPublicKey);
        expect(point.length).toBe(65);
        expect(point[0]).toBe(4);
        expect(base64ToBuffer(blobEnvelope.salt).length).toBe(32);
        expect(base64ToBuffer(blobEnvelope.iv).length).toBe(12);
        await expect(decryptEscrowBlob(blobEnvelope, privateKey)).resolves.toEqual(plaintext);
    });

    it('round-trips releases with the client key ID', async (): Promise<void> => {
        expect(releaseEnvelope.keyId).toBe(ESCROW_CLIENT_KEY_ID);
        expect(JSON.stringify(releaseEnvelope)).not.toContain(release.recoveryShare);
        await expect(openEscrowRelease(releaseEnvelope, privateKey)).resolves.toEqual(
            releasePlaintext
        );
    });

    it('uses fresh ephemeral keys, salts, and IVs', async (): Promise<void> => {
        const other = await encryptEscrowBlob(blob, publicKey, 'enclave-1');
        for (const field of ['ephemeralPublicKey', 'salt', 'iv', 'ciphertext'] as const) {
            expect(other[field]).not.toBe(blobEnvelope[field]);
        }
    });

    it('round-trips a PIN verifier through the blob and release without changing version', async (): Promise<void> => {
        const pinVerifier = 'AB'.repeat(32);
        const envelope = await encryptEscrowBlob({ ...blob, pinVerifier }, publicKey, 'enclave-1');
        expect(envelope.version).toBe(1);
        expect(JSON.stringify(envelope)).not.toContain(pinVerifier.toLowerCase());
        const decrypted = await decryptEscrowBlob(envelope, privateKey);
        expect(decrypted).toEqual({ ...plaintext, pinVerifier: pinVerifier.toLowerCase() });
        const sealed = await sealEscrowRelease({ ...decrypted, holdId: release.holdId }, publicKey);
        expect(sealed.version).toBe(1);
        await expect(openEscrowRelease(sealed, privateKey)).resolves.toEqual({
            ...releasePlaintext,
            pinVerifier: pinVerifier.toLowerCase(),
        });
    });

    it.each(['', 'a'.repeat(63), 'a'.repeat(65), 'g'.repeat(64)])(
        'rejects invalid PIN verifier before encryption %j',
        async (pinVerifier): Promise<void> => {
            await expect(
                encryptEscrowBlob({ ...blob, pinVerifier }, publicKey, 'enclave-1')
            ).rejects.toThrow('pinVerifier');
            await expect(sealEscrowRelease({ ...release, pinVerifier }, publicKey)).rejects.toThrow(
                'pinVerifier'
            );
        }
    );

    it.each(['blob', 'release'] as const)(
        'rejects wrong keys and tampered %s envelopes',
        async (kind): Promise<void> => {
            const envelope = kind === 'blob' ? blobEnvelope : releaseEnvelope;
            const decrypt = kind === 'blob' ? decryptEscrowBlob : openEscrowRelease;
            await expect(decrypt(envelope, wrongPrivateKey)).rejects.toThrow();
            await expect(
                decrypt({ ...envelope, keyId: 'other-key' }, privateKey)
            ).rejects.toThrow();

            for (const field of ['ciphertext', 'salt', 'iv'] as const) {
                const bytes = base64ToBuffer(envelope[field]);
                bytes[0] = (bytes[0] ?? 0) ^ 1;
                await expect(
                    decrypt({ ...envelope, [field]: bufferToBase64(bytes.buffer) }, privateKey)
                ).rejects.toThrow();
            }
            for (const change of [{ version: 2 }, { algorithm: 'AES-GCM' }]) {
                expect(() => parseEscrowEnvelope({ ...envelope, ...change })).toThrow(
                    'Unsupported'
                );
                await expect(decrypt({ ...envelope, ...change }, privateKey)).rejects.toThrow(
                    'Unsupported'
                );
            }
        }
    );

    it('domain-separates blobs and releases even with identical recipient keys and key IDs', async (): Promise<void> => {
        const envelope = await encryptEscrowBlob(blob, publicKey, ESCROW_CLIENT_KEY_ID);
        await expect(openEscrowRelease(envelope, privateKey)).rejects.toMatchObject({
            name: 'OperationError',
        });
        await expect(decryptEscrowBlob(releaseEnvelope, privateKey)).rejects.toMatchObject({
            name: 'OperationError',
        });
    });

    it.each(['', ' ', 'not-base64!', 'YWJj'])(
        'rejects invalid public key %j',
        async (key): Promise<void> => {
            await expect(encryptEscrowBlob(blob, key, 'enclave-1')).rejects.toThrow();
            await expect(sealEscrowRelease(release, key)).rejects.toThrow();
        }
    );

    it.each(['', 'bad key', ' key ', 'bad|key', 'bad/key', 'a'.repeat(129)])(
        'rejects invalid encryption key ID %j',
        async (keyId): Promise<void> => {
            await expect(encryptEscrowBlob(blob, publicKey, keyId)).rejects.toThrow('keyId');
        }
    );

    it('validates plaintext before importing a recipient key', async (): Promise<void> => {
        await expect(encryptEscrowBlob({ ...blob, shareVersion: 0 }, '', '')).rejects.toThrow(
            'shareVersion'
        );
        await expect(sealEscrowRelease({ ...release, holdId: '' }, '')).rejects.toThrow('holdId');
    });

    it.each([
        {
            info: ESCROW_BLOB_INFO,
            input: { ...plaintext, shareVersion: 0 },
            decrypt: decryptEscrowBlob,
            error: 'shareVersion',
        },
        {
            info: ESCROW_BLOB_INFO,
            input: { ...plaintext, pinVerifier: 'a'.repeat(63) },
            decrypt: decryptEscrowBlob,
            error: 'pinVerifier',
        },
        {
            info: ESCROW_RELEASE_INFO,
            input: { ...releasePlaintext, pinVerifier: 'a'.repeat(65) },
            decrypt: openEscrowRelease,
            error: 'pinVerifier',
        },
        {
            info: ESCROW_RELEASE_INFO,
            input: { ...releasePlaintext, holdId: '' },
            decrypt: openEscrowRelease,
            error: 'holdId',
        },
    ])(
        'validates plaintext after authenticated decryption ($info)',
        async ({ info, input, decrypt, error }): Promise<void> => {
            // Independently construct a valid wire envelope carrying invalid JSON fields.
            const recipient = await crypto.subtle.importKey(
                'spki',
                base64ToBuffer(publicKey),
                { name: 'ECDH', namedCurve: 'P-256' },
                false,
                []
            );
            const ephemeral = await crypto.subtle.generateKey(
                { name: 'ECDH', namedCurve: 'P-256' },
                true,
                ['deriveBits']
            );
            const secret = await crypto.subtle.deriveBits(
                { name: 'ECDH', public: recipient },
                ephemeral.privateKey,
                256
            );
            const material = await crypto.subtle.importKey('raw', secret, 'HKDF', false, [
                'deriveKey',
            ]);
            const salt = crypto.getRandomValues(new Uint8Array(32));
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const key = await crypto.subtle.deriveKey(
                { name: 'HKDF', hash: 'SHA-256', salt, info: new TextEncoder().encode(info) },
                material,
                { name: 'AES-GCM', length: 256 },
                false,
                ['encrypt']
            );
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv,
                    additionalData: new TextEncoder().encode(`1|${ESCROW_ALGORITHM}|client`),
                },
                key,
                new TextEncoder().encode(JSON.stringify(input))
            );
            await expect(
                decrypt(
                    {
                        version: 1,
                        algorithm: ESCROW_ALGORITHM,
                        keyId: 'client',
                        ephemeralPublicKey: bufferToBase64(
                            await crypto.subtle.exportKey('raw', ephemeral.publicKey)
                        ),
                        salt: bufferToBase64(salt.buffer),
                        iv: bufferToBase64(iv.buffer),
                        ciphertext: bufferToBase64(ciphertext),
                    },
                    privateKey
                )
            ).rejects.toThrow(error);
        }
    );
});

describe('escrow parsing', () => {
    it('accepts legacy plaintext without a PIN verifier', (): void => {
        expect(parseEscrowBlobPlaintext(plaintext)).toEqual(plaintext);
        expect(parseEscrowBlobPlaintext(plaintext)).not.toHaveProperty('pinVerifier');
        expect(parseEscrowReleasePlaintext(releasePlaintext)).toEqual(releasePlaintext);
    });

    const envelope = {
        version: 1,
        algorithm: ESCROW_ALGORITHM,
        keyId: 'enclave-1',
        ephemeralPublicKey: 'point',
        salt: 'salt',
        iv: 'iv',
        ciphertext: 'ciphertext',
    };

    it('copies only recognized fields', (): void => {
        expect(parseEscrowEnvelope({ ...envelope, extra: true })).toEqual(envelope);
        expect(parseEscrowBlobPlaintext({ ...releasePlaintext, extra: true })).toEqual(plaintext);
        expect(parseEscrowReleasePlaintext({ ...releasePlaintext, extra: true })).toEqual(
            releasePlaintext
        );
    });

    it.each([null, undefined, [], 'value', 1])('rejects non-record input %j', (value): void => {
        expect(() => parseEscrowEnvelope(value)).toThrow();
        expect(() => parseEscrowBlobPlaintext(value)).toThrow();
        expect(() => parseEscrowReleasePlaintext(value)).toThrow();
    });

    it.each([
        ['keyId', 128],
        ['ephemeralPublicKey', 256],
        ['salt', 128],
        ['iv', 64],
        ['ciphertext', 16_384],
    ] as const)('enforces envelope %s bounds and required type', (field, max): void => {
        for (const value of [undefined, '', 123, 'a'.repeat(max + 1)]) {
            expect(() => parseEscrowEnvelope({ ...envelope, [field]: value })).toThrow(field);
        }
        expect(parseEscrowEnvelope({ ...envelope, [field]: 'a'.repeat(max) })[field]).toHaveLength(
            max
        );
    });

    it.each(['bad key', 'bad|key', 'bad/key'])('rejects bad parsed key ID %j', (keyId): void => {
        expect(() => parseEscrowEnvelope({ ...envelope, keyId })).toThrow('keyId');
    });

    it.each([undefined, 0, 2, '1'])('rejects unsupported versions %j', (version): void => {
        expect(() => parseEscrowEnvelope({ ...envelope, version })).toThrow('Unsupported');
        expect(() => parseEscrowBlobPlaintext({ ...plaintext, version })).toThrow();
        expect(() => parseEscrowReleasePlaintext({ ...releasePlaintext, version })).toThrow();
    });

    it.each([undefined, '', 'other'])('rejects unsupported algorithms %j', (algorithm): void => {
        expect(() => parseEscrowEnvelope({ ...envelope, algorithm })).toThrow('Unsupported');
    });

    it.each([
        ['recoveryShare', undefined],
        ['recoveryShare', 'abcd'],
        ['recoveryShare', 'abcgh'],
        ['recoveryShare', 'a'.repeat(4_097)],
        ['recoveryShare', 12345],
        ['did', undefined],
        ['did', ''],
        ['did', 'not:did'],
        ['did', `did:${'a'.repeat(2_045)}`],
        ['shareVersion', undefined],
        ['shareVersion', 0],
        ['shareVersion', -1],
        ['shareVersion', 1.5],
        ['shareVersion', '1'],
        ['shareVersion', NaN],
        ['shareVersion', Infinity],
        ['pinVerifier', null],
        ['pinVerifier', 123],
        ['pinVerifier', ''],
        ['pinVerifier', 'a'.repeat(63)],
        ['pinVerifier', 'a'.repeat(65)],
        ['pinVerifier', 'g'.repeat(64)],
    ])('rejects invalid plaintext %s = %j', (field, value): void => {
        expect(() => parseEscrowBlobPlaintext({ ...plaintext, [field]: value })).toThrow(field);
        expect(() => parseEscrowReleasePlaintext({ ...releasePlaintext, [field]: value })).toThrow(
            field
        );
    });

    it.each([undefined, '', 'bad hold', 'bad|hold', 'a'.repeat(129), 123])(
        'rejects invalid hold ID %j',
        (holdId): void => {
            expect(() => parseEscrowReleasePlaintext({ ...releasePlaintext, holdId })).toThrow(
                'holdId'
            );
        }
    );

    it('accepts bounds and normalizes uppercase hex', (): void => {
        expect(
            parseEscrowBlobPlaintext({ ...plaintext, recoveryShare: 'ABCDE' }).recoveryShare
        ).toBe('abcde');
        const maximum = {
            ...releasePlaintext,
            recoveryShare: 'a'.repeat(4_096),
            did: `did:${'a'.repeat(2_044)}`,
            holdId: 'a'.repeat(128),
        };
        expect(parseEscrowReleasePlaintext(maximum)).toEqual(maximum);
    });
});
