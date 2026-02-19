/**
 * QR Login Crypto Helpers
 *
 * X25519 ECDH key exchange + AES-256-GCM encryption for cross-device
 * share transfer. Uses the Web Crypto API exclusively — no external deps.
 *
 * Flow:
 *   Device B generates an ephemeral X25519 keypair, shares the public key.
 *   Device A derives a shared secret via ECDH, encrypts the device share
 *   with AES-256-GCM, and sends the ciphertext.
 *   Device B decrypts with the same derived shared secret.
 */

import { bufferToBase64, base64ToBuffer } from './crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface EphemeralKeypair {
    /** Base64-encoded X25519 public key (sent to server / encoded in QR) */
    publicKey: string;

    /** Raw CryptoKey — kept in memory on Device B, never leaves the device */
    privateKey: CryptoKey;
}

export interface EncryptedSharePayload {
    /** Base64-encoded AES-256-GCM ciphertext */
    ciphertext: string;

    /** Base64-encoded 12-byte IV */
    iv: string;

    /** Base64-encoded ephemeral public key of the *sender* (Device A) */
    senderPublicKey: string;
}

// ---------------------------------------------------------------------------
// Key Generation
// ---------------------------------------------------------------------------

/**
 * Generate an ephemeral X25519 keypair for the new device (Device B).
 * The public key is shared via QR / short code; the private key stays in memory.
 */
export const generateEphemeralKeypair = async (): Promise<EphemeralKeypair> => {
    const keyPair = await crypto.subtle.generateKey(
        { name: 'X25519' },
        false,
        ['deriveBits']
    ) as CryptoKeyPair;

    const rawPublicKey = await crypto.subtle.exportKey('raw', keyPair.publicKey);

    return {
        publicKey: bufferToBase64(rawPublicKey),
        privateKey: keyPair.privateKey,
    };
};

// ---------------------------------------------------------------------------
// Shared Secret Derivation
// ---------------------------------------------------------------------------

/**
 * Import a raw X25519 public key from base64.
 */
const importPublicKey = async (base64Key: string): Promise<CryptoKey> => {
    const keyBytes = base64ToBuffer(base64Key);

    return crypto.subtle.importKey(
        'raw',
        keyBytes,
        { name: 'X25519' },
        false,
        []
    );
};

/**
 * Derive a 256-bit AES-GCM key from our private key + their public key
 * using X25519 ECDH → HKDF-SHA256.
 *
 * The raw ECDH output is fed through HKDF with a context-specific info
 * string to produce the final encryption key (NIST SP 800-56C compliant).
 */
const deriveSharedAesKey = async (
    ourPrivateKey: CryptoKey,
    theirPublicKeyBase64: string
): Promise<CryptoKey> => {
    const theirPublicKey = await importPublicKey(theirPublicKeyBase64);

    const sharedBits = await crypto.subtle.deriveBits(
        { name: 'X25519', public: theirPublicKey },
        ourPrivateKey,
        256
    );

    // Import raw ECDH output as HKDF key material
    const hkdfKey = await crypto.subtle.importKey(
        'raw',
        sharedBits,
        'HKDF',
        false,
        ['deriveKey']
    );

    // Derive the final AES-256-GCM key via HKDF-SHA256
    const encoder = new TextEncoder();

    return crypto.subtle.deriveKey(
        {
            name: 'HKDF',
            hash: 'SHA-256',
            salt: new Uint8Array(32), // fixed empty salt (ephemeral keys provide freshness)
            info: encoder.encode('learncard-qr-login-v1'),
        },
        hkdfKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
};

// ---------------------------------------------------------------------------
// Encrypt / Decrypt
// ---------------------------------------------------------------------------

/**
 * Encrypt a device share for transfer to Device B.
 *
 * Called by Device A (the logged-in device):
 *   1. Generates its own ephemeral X25519 keypair
 *   2. Derives a shared secret from its private key + Device B's public key
 *   3. Encrypts the share with AES-256-GCM
 *   4. Returns the ciphertext + IV + Device A's ephemeral public key
 *
 * @param deviceShare - Plaintext device share to encrypt
 * @param recipientPublicKey - Base64-encoded X25519 public key from Device B
 */
export const encryptShareForTransfer = async (
    deviceShare: string,
    recipientPublicKey: string
): Promise<EncryptedSharePayload> => {
    // Generate sender's ephemeral keypair
    const senderKeypair = await generateEphemeralKeypair();

    // Derive shared AES key
    const aesKey = await deriveSharedAesKey(senderKeypair.privateKey, recipientPublicKey);

    // Encrypt
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();

    const ciphertextBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        aesKey,
        encoder.encode(deviceShare)
    );

    return {
        ciphertext: bufferToBase64(ciphertextBuffer),
        iv: bufferToBase64(iv.buffer),
        senderPublicKey: senderKeypair.publicKey,
    };
};

/**
 * Decrypt a device share received from Device A.
 *
 * Called by Device B (the new device):
 *   1. Derives the shared secret from its private key + Device A's public key
 *   2. Decrypts the ciphertext with AES-256-GCM
 *
 * @param payload - The encrypted payload from Device A
 * @param recipientPrivateKey - Device B's ephemeral private CryptoKey
 */
export const decryptShareFromTransfer = async (
    payload: EncryptedSharePayload,
    recipientPrivateKey: CryptoKey
): Promise<string> => {
    // Derive shared AES key
    const aesKey = await deriveSharedAesKey(recipientPrivateKey, payload.senderPublicKey);

    // Decrypt
    const ivBytes = base64ToBuffer(payload.iv);
    const ciphertextBytes = base64ToBuffer(payload.ciphertext);

    const plaintextBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        aesKey,
        ciphertextBytes
    );

    const decoder = new TextDecoder();

    return decoder.decode(plaintextBuffer);
};
