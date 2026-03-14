/**
 * Server-side auth share encryption at rest.
 *
 * Derives a purpose-specific AES-256-GCM key from the server SEED using HKDF,
 * then encrypts/decrypts the auth share's `encryptedData` field before writing
 * to or reading from MongoDB.
 *
 * Legacy (unencrypted) shares are detected by an empty `iv` field and can be
 * transparently migrated on read via `migrateIfNeeded`.
 */

import crypto from 'crypto';

import type { ServerEncryptedShare } from '@models';

// ── Constants ────────────────────────────────────────────────────────────────

const HKDF_SALT = 'lca-auth-share-encryption';
const HKDF_INFO = 'v1';
const KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // 96-bit IV for AES-GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

// ── Key derivation ───────────────────────────────────────────────────────────

let cachedKey: Buffer | null = null;
let cachedSeedFingerprint: string | null = null;

/**
 * Derive a deterministic AES-256 key from the server SEED via HKDF-SHA256.
 * The result is cached for the lifetime of the process.
 */
const deriveKey = (seed: string): Buffer => {
    // Simple fingerprint to detect if SEED changed (shouldn't happen at runtime)
    const fingerprint = crypto.createHash('sha256').update(seed).digest('hex').slice(0, 16);

    if (cachedKey && cachedSeedFingerprint === fingerprint) {
        return cachedKey;
    }

    const seedBytes = Buffer.from(seed, 'utf8');
    const salt = Buffer.from(HKDF_SALT, 'utf8');
    const info = Buffer.from(HKDF_INFO, 'utf8');

    cachedKey = Buffer.from(crypto.hkdfSync('sha256', seedBytes, salt, info, KEY_LENGTH));
    cachedSeedFingerprint = fingerprint;

    return cachedKey;
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypt a ServerEncryptedShare's `encryptedData` field using AES-256-GCM.
 *
 * The raw share data (currently stored in `encryptedData`) is encrypted and the
 * result is written back into the same shape:
 * - `encryptedData`: base64-encoded ciphertext (includes GCM auth tag)
 * - `iv`: base64-encoded 96-bit IV
 * - `encryptedDek`: set to `"server-v1"` as a version marker
 */
export const encryptAuthShare = (
    share: ServerEncryptedShare,
    seed: string
): ServerEncryptedShare => {
    const key = deriveKey(seed);
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    const plaintext = Buffer.from(share.encryptedData, 'utf8');

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Append auth tag to ciphertext so it's a single blob
    const ciphertextWithTag = Buffer.concat([encrypted, authTag]);

    return {
        encryptedData: ciphertextWithTag.toString('base64'),
        iv: iv.toString('base64'),
        encryptedDek: 'server-v1',
    };
};

/**
 * Decrypt a ServerEncryptedShare that was encrypted by `encryptAuthShare`.
 *
 * Returns the share in its original form (raw share data in `encryptedData`,
 * empty `iv` and `encryptedDek`) so the client receives what it originally sent.
 */
export const decryptAuthShare = (
    share: ServerEncryptedShare,
    seed: string
): ServerEncryptedShare => {
    // Legacy (unencrypted) shares don't have the version marker — pass through as-is
    if (share.encryptedDek !== 'server-v1') {
        return share;
    }

    const key = deriveKey(seed);
    const iv = Buffer.from(share.iv, 'base64');
    const ciphertextWithTag = Buffer.from(share.encryptedData, 'base64');

    // Split ciphertext and auth tag
    const ciphertext = ciphertextWithTag.subarray(0, ciphertextWithTag.length - AUTH_TAG_LENGTH);
    const authTag = ciphertextWithTag.subarray(ciphertextWithTag.length - AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv, {
        authTagLength: AUTH_TAG_LENGTH,
    });

    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return {
        encryptedData: decrypted.toString('utf8'),
        encryptedDek: '',
        iv: '',
    };
};

