import { createHash } from 'crypto';

export interface EscrowEnvelopeFields {
    version: number;
    algorithm: string;
    keyId: string;
    ephemeralPublicKey: string;
    salt: string;
    iv: string;
    ciphertext: string;
}

const DOMAIN = Buffer.from('learncard-escrow-blob-id-v1\0', 'utf8');

const lengthPrefixed = (field: Buffer): Buffer => {
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(field.length));
    return Buffer.concat([length, field]);
};

/**
 * Mirrors `escrow_blob_identity` in services/escrow-enclave-app/src/crypto.rs.
 *
 * ECDH uses only the x-coordinate, so an envelope and its negated-point twin
 * decrypt identically. Hashing decoded bytes with only the point's x-coordinate
 * gives both the same identity, and neutralises base64/JSON serialization aliases.
 */
export const escrowBlobIdentity = (envelope: EscrowEnvelopeFields): string => {
    const point = Buffer.from(envelope.ephemeralPublicKey, 'base64');
    const salt = Buffer.from(envelope.salt, 'base64');
    const iv = Buffer.from(envelope.iv, 'base64');
    const ciphertext = Buffer.from(envelope.ciphertext, 'base64');
    if (
        envelope.version !== 1 ||
        point.length !== 65 ||
        point[0] !== 4 ||
        salt.length !== 32 ||
        iv.length !== 12 ||
        ciphertext.length < 16
    )
        throw new Error('Invalid escrow payload');

    const hash = createHash('sha256').update(DOMAIN);
    for (const field of [
        Buffer.from([1]),
        Buffer.from(envelope.algorithm, 'utf8'),
        Buffer.from(envelope.keyId, 'utf8'),
        point.subarray(1, 33),
        salt,
        iv,
        ciphertext,
    ])
        hash.update(lengthPrefixed(field));
    return hash.digest('hex');
};
