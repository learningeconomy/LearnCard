import { beforeAll, describe, expect, it } from 'vitest';

import { bufferToBase64 } from './crypto';
import {
    decryptEmailRelayPayload,
    encryptEmailRelayPayload,
    generateEmailRelayConfirmationCode,
} from './email-relay-crypto';

describe('email relay encryption', () => {
    let publicKeyBase64 = '';
    let privateKeyBase64 = '';

    beforeAll(async () => {
        const keyPair = await crypto.subtle.generateKey(
            { name: 'ECDH', namedCurve: 'P-256' },
            true,
            ['deriveBits']
        );
        const [publicKey, privateKey] = await Promise.all([
            crypto.subtle.exportKey('spki', keyPair.publicKey),
            crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
        ]);

        publicKeyBase64 = bufferToBase64(publicKey);
        privateKeyBase64 = bufferToBase64(privateKey);
    });

    it('sends no raw recovery key and round-trips with the relay private key', async () => {
        const recoveryKey = `0001${'ab'.repeat(48)}`;
        const confirmationCode = '483920';
        const envelope = await encryptEmailRelayPayload(
            {
                targetEmail: 'Recovery@Example.com',
                recoveryKey,
                confirmationCode,
                branding: { brandName: 'Test Tenant', fromDomain: 'example.com' },
            },
            publicKeyBase64,
            'test-key-1'
        );

        expect(JSON.stringify(envelope)).not.toContain(recoveryKey);
        expect(JSON.stringify(envelope)).not.toContain(confirmationCode);
        await expect(decryptEmailRelayPayload(envelope, privateKeyBase64)).resolves.toEqual({
            version: 1,
            targetEmail: 'recovery@example.com',
            recoveryKey,
            confirmationCode,
            branding: { brandName: 'Test Tenant', fromDomain: 'example.com' },
        });
    });

    it('authenticates envelope metadata and ciphertext', async () => {
        const envelope = await encryptEmailRelayPayload(
            {
                targetEmail: 'recovery@example.com',
                recoveryKey: `0002${'cd'.repeat(48)}`,
                confirmationCode: '123456',
            },
            publicKeyBase64,
            'test-key-1'
        );

        await expect(
            decryptEmailRelayPayload({ ...envelope, keyId: 'other-key' }, privateKeyBase64)
        ).rejects.toThrow();

        const lastCharacter = envelope.ciphertext.at(-1);
        const tamperedCiphertext = `${envelope.ciphertext.slice(0, -1)}${
            lastCharacter === 'A' ? 'B' : 'A'
        }`;

        await expect(
            decryptEmailRelayPayload(
                { ...envelope, ciphertext: tamperedCiphertext },
                privateKeyBase64
            )
        ).rejects.toThrow();
    });

    it('generates exactly six decimal digits', () => {
        const codes = Array.from({ length: 100 }, generateEmailRelayConfirmationCode);

        expect(codes.every(code => /^\d{6}$/.test(code))).toBe(true);
    });
});
