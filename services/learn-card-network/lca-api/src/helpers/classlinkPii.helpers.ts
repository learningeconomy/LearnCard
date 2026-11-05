import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';

import { environment } from '@environment';
import type { MongoClassLinkIdentityType } from '../models/ClassLinkIdentity';

const PAYLOAD_VERSION = 'v1';
const PURPOSE = 'classlink-state-student-id';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export interface SealedStateStudentId {
    stateStudentIdEnc: string;
    stateStudentIdExpiresAt: Date;
}

/** CLASSLINK_PII_KEY is base64 for exactly 32 bytes. Anything else is treated as missing. */
const getPiiKey = (): Buffer | null => {
    const encoded = environment.CLASSLINK_PII_KEY?.trim();
    if (!encoded) return null;
    const key = Buffer.from(encoded, 'base64');
    if (key.length !== KEY_LENGTH || key.toString('base64') !== encoded) return null;
    return key;
};

/** Domain-separated identity HMAC; an unusable key disables school sign-in. */
const identityHmac = (value: string): Buffer => {
    const key = getPiiKey();
    if (!key) {
        console.warn('classlink.pii.key_missing');
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: 'School sign-in is not configured.',
        });
    }
    const subKey = createHmac('sha256', key).update('classlink-identity-v1').digest();
    try {
        return createHmac('sha256', subKey).update(value).digest();
    } finally {
        key.fill(0);
        subKey.fill(0);
    }
};

/** Opaque tenant-scoped identifier derived only from verified claims. */
export const classLinkSubjectDigest = (tenantId: string, sourcedId: string): string =>
    identityHmac(JSON.stringify([tenantId, sourcedId])).toString('base64url');

/** Stable keyed UID for new identities; existing stored UIDs are retained. */
export const classLinkFirebaseUid = (identityKey: string): string =>
    `classlink_${identityHmac(identityKey).toString('hex').slice(0, 28)}`;

// The identity key binds a ciphertext to its record, so it cannot be copied to another student.
const getAad = (identityKey: string): Buffer =>
    Buffer.from(JSON.stringify([PURPOSE, PAYLOAD_VERSION, identityKey]));

/**
 * Encrypt a state student ID that expires `maxAgeSeconds` after the sign-in that supplied it.
 * Returns null (store nothing) when there is no value or no usable key.
 */
export const sealStateStudentId = (
    value: string | null,
    identityKey: string,
    signInTime: Date,
    maxAgeSeconds: number
): SealedStateStudentId | null => {
    if (!value) return null;
    const expiresAt = new Date(signInTime.getTime() + maxAgeSeconds * 1000);
    if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return null;
    const key = getPiiKey();
    if (!key) {
        console.warn('classlink.pii.key_missing');
        return null;
    }
    const iv = randomBytes(IV_LENGTH);
    const plaintext = Buffer.from(value, 'utf8');
    try {
        const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_LENGTH });
        cipher.setAAD(getAad(identityKey));
        const sealed = Buffer.concat([
            iv,
            cipher.update(plaintext),
            cipher.final(),
            cipher.getAuthTag(),
        ]);
        return {
            stateStudentIdEnc: `${PAYLOAD_VERSION}:${sealed.toString('base64')}`,
            stateStudentIdExpiresAt: expiresAt,
        };
    } finally {
        plaintext.fill(0);
        key.fill(0);
    }
};

const openStateStudentId = (payload: string, identityKey: string): string | null => {
    const [version, encoded, ...rest] = payload.split(':');
    if (version !== PAYLOAD_VERSION || !encoded || rest.length) return null;
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length <= IV_LENGTH + TAG_LENGTH) return null;
    const key = getPiiKey();
    if (!key) {
        console.warn('classlink.pii.key_missing');
        return null;
    }
    try {
        const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, IV_LENGTH), {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAAD(getAad(identityKey));
        decipher.setAuthTag(bytes.subarray(-TAG_LENGTH));
        const plaintext = Buffer.concat([
            decipher.update(bytes.subarray(IV_LENGTH, -TAG_LENGTH)),
            decipher.final(),
        ]);
        const value = plaintext.toString('utf8');
        plaintext.fill(0);
        return value || null;
    } catch {
        // A wrong key or a ciphertext moved between records. Never log the payload.
        console.warn('classlink.pii.decrypt_failed');
        return null;
    } finally {
        key.fill(0);
    }
};

/** True when the record holds a state ID (or legacy plaintext) that may no longer be kept. */
export const hasExpiredStateStudentId = (
    identity: Pick<
        MongoClassLinkIdentityType,
        'stateStudentId' | 'stateStudentIdEnc' | 'stateStudentIdExpiresAt'
    >,
    now = new Date()
): boolean => {
    if (identity.stateStudentId !== undefined) return true;
    if (identity.stateStudentIdEnc === undefined) return false;
    const expiresAt = identity.stateStudentIdExpiresAt;
    return !(expiresAt instanceof Date) || expiresAt.getTime() <= now.getTime();
};

/** The decrypted state student ID, or null when absent, expired or unreadable. */
export const getStateStudentId = (
    identity: Pick<
        MongoClassLinkIdentityType,
        'identityKey' | 'stateStudentIdEnc' | 'stateStudentIdExpiresAt'
    >,
    now = new Date()
): string | null => {
    const { stateStudentIdEnc, stateStudentIdExpiresAt } = identity;
    if (typeof stateStudentIdEnc !== 'string' || !(stateStudentIdExpiresAt instanceof Date))
        return null;
    if (stateStudentIdExpiresAt.getTime() <= now.getTime()) return null;
    return openStateStudentId(stateStudentIdEnc, identity.identityKey);
};
