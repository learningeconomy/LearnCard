import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { VCValidator, type VC } from '@learncard/types';
import { getCurrentAiSubject } from '../ai/privacy';
import { getPrivacyKeyMaterial } from '../ai/privacy-keys';
import { fingerprintCredential } from './verification';

export interface RawCredentialEnvelope {
    version: 1;
    did: string;
    uri: string;
    contentHash: string;
    storedAt: string;
    expiresAt: Date;
    ciphertext: string;
    iv: string;
    authTag: string;
}

// Raw originals are retained separately from model context for at most 30 days
// after an explicit retention write. Reads never extend the retention period.
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export function assertRawCredentialOwner(did: string): void {
    if (!did || getCurrentAiSubject() !== did) {
        throw new Error('Raw credential access requires the authenticated owner');
    }
}

const aad = (
    entry: Pick<
        RawCredentialEnvelope,
        'version' | 'did' | 'uri' | 'contentHash' | 'storedAt' | 'expiresAt'
    >
): Buffer =>
    Buffer.from(
        JSON.stringify([
            entry.version,
            entry.did,
            entry.uri,
            entry.contentHash,
            entry.storedAt,
            entry.expiresAt.toISOString(),
        ])
    );

export function encryptRawCredential(
    did: string,
    uri: string,
    contentHash: string,
    rawCredentialJson: string,
    now = new Date()
): RawCredentialEnvelope {
    assertRawCredentialOwner(did);
    const credential = JSON.parse(rawCredentialJson) as VC;
    VCValidator.parse(credential);
    if (!uri || fingerprintCredential(credential) !== contentHash) {
        throw new Error('Raw credential fingerprint mismatch');
    }
    const metadata = {
        version: 1 as const,
        did,
        uri,
        contentHash,
        storedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + RETENTION_MS),
    };
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getPrivacyKeyMaterial().rawCredential, iv);
    cipher.setAAD(aad(metadata));
    const ciphertext = Buffer.concat([cipher.update(rawCredentialJson, 'utf8'), cipher.final()]);
    return {
        ...metadata,
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
    };
}

export function decryptRawCredential(
    did: string,
    uri: string,
    contentHash: string,
    envelope: RawCredentialEnvelope,
    now = new Date()
): { credential: VC; rawCredentialJson: string } {
    assertRawCredentialOwner(did);
    try {
        if (
            envelope.version !== 1 ||
            envelope.did !== did ||
            envelope.uri !== uri ||
            envelope.contentHash !== contentHash ||
            !(envelope.expiresAt instanceof Date) ||
            envelope.expiresAt <= now
        ) {
            throw new Error();
        }
        const decipher = createDecipheriv(
            'aes-256-gcm',
            getPrivacyKeyMaterial().rawCredential,
            Buffer.from(envelope.iv, 'base64')
        );
        decipher.setAAD(aad(envelope));
        decipher.setAuthTag(Buffer.from(envelope.authTag, 'base64'));
        const rawCredentialJson = Buffer.concat([
            decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
            decipher.final(),
        ]).toString('utf8');
        const credential = JSON.parse(rawCredentialJson) as VC;
        VCValidator.parse(credential);
        if (fingerprintCredential(credential) !== contentHash) throw new Error();
        return { credential, rawCredentialJson };
    } catch {
        throw new Error('Raw credential is unavailable or failed integrity validation');
    }
}
