import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { getPrivacySubjectRef, getPrivacyKeyMaterial } from '../ai/privacy-keys';
export type VectorSource = {
    kind: 'credential';
    key: string;
    epoch: string;
    contentHash?: string;
    consentRevision: string;
};
export const vectorSourceRef = (did: string, kind: string, key: string) =>
    createHash('sha256')
        .update(JSON.stringify([getPrivacySubjectRef(did), kind, key]))
        .digest('hex');

export type SourceCleanupTask = {
    _id: string;
    subjectRef: string;
    kind: 'credential' | 'thread';
    revision: string;
    ciphertext: string;
    iv: string;
    authTag: string;
    collections: string[];
    collectionIndex: number;
    offset?: string | number;
    discoveryComplete: boolean;
};
export function encryptCleanupScope(id: string, scope: { did: string; key: string }) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', getPrivacyKeyMaterial().sourceCleanup, iv);
    cipher.setAAD(Buffer.from(`source-vector-cleanup:v1|${id}`));
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(scope)), cipher.final()]);
    return {
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
    };
}
export function decryptCleanupScope(task: SourceCleanupTask): {
    did: string;
    key: string;
} {
    const decipher = createDecipheriv(
        'aes-256-gcm',
        getPrivacyKeyMaterial().sourceCleanup,
        Buffer.from(task.iv, 'base64')
    );
    decipher.setAAD(Buffer.from(`source-vector-cleanup:v1|${task._id}`));
    decipher.setAuthTag(Buffer.from(task.authTag, 'base64'));
    const result = JSON.parse(
        Buffer.concat([
            decipher.update(Buffer.from(task.ciphertext, 'base64')),
            decipher.final(),
        ]).toString('utf8')
    );
    if (
        typeof result.did !== 'string' ||
        typeof result.key !== 'string' ||
        getPrivacySubjectRef(result.did) !== task.subjectRef ||
        vectorSourceRef(result.did, task.kind, result.key) !== task._id
    )
        throw new Error('Cleanup scope integrity failure');
    return result;
}
