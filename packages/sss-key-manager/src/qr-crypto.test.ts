/**
 * Tests for QR Login Crypto Helpers (X25519 ECDH + AES-256-GCM)
 */

import { describe, it, expect } from 'vitest';

import {
    generateEphemeralKeypair,
    encryptShareForTransfer,
    decryptShareFromTransfer,
} from './qr-crypto';

// Node 20+ supports X25519 in crypto.subtle.
// jsdom doesn't provide its own Web Crypto — it falls through to Node's.
// If this environment doesn't support X25519, skip gracefully.
const supportsX25519 = async (): Promise<boolean> => {
    try {
        await crypto.subtle.generateKey({ name: 'X25519' }, false, ['deriveBits']);
        return true;
    } catch {
        return false;
    }
};

describe('QR Crypto (X25519 ECDH + AES-GCM)', async () => {
    const supported = await supportsX25519();

    it.skipIf(!supported)('generateEphemeralKeypair returns a public key string and private CryptoKey', async () => {
        const keypair = await generateEphemeralKeypair();

        expect(keypair.publicKey).toBeTruthy();
        expect(typeof keypair.publicKey).toBe('string');

        // X25519 public keys are 32 bytes → 44 chars in base64
        expect(keypair.publicKey.length).toBeGreaterThanOrEqual(40);

        expect(keypair.privateKey).toBeTruthy();
        expect(keypair.privateKey.type).toBe('private');
    });

    it.skipIf(!supported)('generates unique keypairs on each call', async () => {
        const kp1 = await generateEphemeralKeypair();
        const kp2 = await generateEphemeralKeypair();

        expect(kp1.publicKey).not.toBe(kp2.publicKey);
    });

    it.skipIf(!supported)('encrypt + decrypt round-trip produces the original share', async () => {
        const deviceShare = 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789ab';

        // Device B generates keypair
        const deviceB = await generateEphemeralKeypair();

        // Device A encrypts the share for Device B
        const encrypted = await encryptShareForTransfer(deviceShare, deviceB.publicKey);

        expect(encrypted.ciphertext).toBeTruthy();
        expect(encrypted.iv).toBeTruthy();
        expect(encrypted.senderPublicKey).toBeTruthy();

        // Device B decrypts
        const decrypted = await decryptShareFromTransfer(encrypted, deviceB.privateKey);

        expect(decrypted).toBe(deviceShare);
    });

    it.skipIf(!supported)('decryption with wrong private key fails', async () => {
        const deviceShare = 'secret-share-data-12345';

        const deviceB = await generateEphemeralKeypair();
        const wrongKey = await generateEphemeralKeypair();

        const encrypted = await encryptShareForTransfer(deviceShare, deviceB.publicKey);

        // Try to decrypt with a different private key — should fail
        await expect(
            decryptShareFromTransfer(encrypted, wrongKey.privateKey)
        ).rejects.toThrow();
    });

    it.skipIf(!supported)('encrypted payload is different each time (unique IV + sender key)', async () => {
        const deviceShare = 'some-share';

        const deviceB = await generateEphemeralKeypair();

        const enc1 = await encryptShareForTransfer(deviceShare, deviceB.publicKey);
        const enc2 = await encryptShareForTransfer(deviceShare, deviceB.publicKey);

        // Different IVs
        expect(enc1.iv).not.toBe(enc2.iv);

        // Different sender keys (each call generates a new ephemeral pair)
        expect(enc1.senderPublicKey).not.toBe(enc2.senderPublicKey);

        // Different ciphertexts
        expect(enc1.ciphertext).not.toBe(enc2.ciphertext);

        // But both decrypt to the same share
        const dec1 = await decryptShareFromTransfer(enc1, deviceB.privateKey);
        const dec2 = await decryptShareFromTransfer(enc2, deviceB.privateKey);

        expect(dec1).toBe(deviceShare);
        expect(dec2).toBe(deviceShare);
    });

    it.skipIf(!supported)('handles various share lengths correctly', async () => {
        const shares = [
            'short',
            'a'.repeat(66),   // typical SSS hex share
            'a'.repeat(1000), // unusually long
            '🔐🔑',          // unicode
        ];

        for (const share of shares) {
            const deviceB = await generateEphemeralKeypair();
            const encrypted = await encryptShareForTransfer(share, deviceB.publicKey);
            const decrypted = await decryptShareFromTransfer(encrypted, deviceB.privateKey);

            expect(decrypted).toBe(share);
        }
    });
});
