import { createHmac, hkdfSync } from 'node:crypto';

import { AI_PRIVACY_KEY } from '../constants/env';

interface PrivacyKeyMaterial {
    encryption: Buffer;
    reference: Buffer;
    rawCredential: Buffer;
    ownerJob: Buffer;
    erasureRequest: Buffer;
    sourceCleanup: Buffer;
}

let keyMaterial: PrivacyKeyMaterial | undefined;

export const getPrivacyKeyMaterial = (): PrivacyKeyMaterial => {
    if (keyMaterial) return keyMaterial;

    const root = Buffer.from(AI_PRIVACY_KEY, 'base64');
    if (root.length !== 32 || root.toString('base64') !== AI_PRIVACY_KEY) {
        throw new Error('AI_PRIVACY_KEY must be a canonical base64-encoded 32-byte key');
    }

    keyMaterial = {
        encryption: Buffer.from(
            hkdfSync('sha256', root, 'ai-passport', 'identifier-mapping:v1', 32)
        ),
        reference: Buffer.from(hkdfSync('sha256', root, 'ai-passport', 'privacy-reference:v1', 32)),
        rawCredential: Buffer.from(
            hkdfSync('sha256', root, 'ai-passport', 'raw-credential-vault:v1', 32)
        ),
        ownerJob: Buffer.from(hkdfSync('sha256', root, 'ai-passport', 'owner-job-payload:v1', 32)),
        sourceCleanup: Buffer.from(
            hkdfSync('sha256', root, 'ai-passport', 'source-vector-cleanup:v1', 32)
        ),
        erasureRequest: Buffer.from(
            hkdfSync('sha256', root, 'ai-passport', 'erasure-request:v1', 32)
        ),
    };
    root.fill(0);
    return keyMaterial;
};

export const getPrivacySubjectRef = (did: string): string => {
    if (!did) throw new Error('An authenticated privacy subject is required');

    return createHmac('sha256', getPrivacyKeyMaterial().reference)
        .update('owner\0')
        .update(did)
        .digest('hex');
};
