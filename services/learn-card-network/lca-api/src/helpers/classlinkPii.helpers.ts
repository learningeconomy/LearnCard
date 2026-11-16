import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto';
import { TRPCError } from '@trpc/server';

import { environment } from '@environment';
import { decodeClassLinkKey as decodeKey } from './classlinkKey';
import type { MongoClassLinkIdentityType } from '../models/ClassLinkIdentity';

/** Legacy payload: `v1:<base64>`, sealed with CLASSLINK_PII_KEY and no key id. */
const LEGACY_PAYLOAD_VERSION = 'v1';
/** Current payload: `v2:<kid>:<base64>`, where kid identifies the encryption key. */
const PAYLOAD_VERSION = 'v2';
const PURPOSE = 'classlink-state-student-id';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_ID_LENGTH = 8;

export interface SealedStateStudentId {
    stateStudentIdEnc: string;
    stateStudentIdExpiresAt: Date;
}

/**
 * Short, non-secret identifier for an encryption key, stored in each payload so the
 * right key is chosen after CLASSLINK_PII_KEY rotation.
 */
const keyId = (key: Buffer): string =>
    createHash('sha256')
        .update('classlink-pii-kid-v1')
        .update(key)
        .digest('hex')
        .slice(0, KEY_ID_LENGTH);

/** Encryption keys: the current CLASSLINK_PII_KEY first, then CLASSLINK_PII_KEY_PREVIOUS. */
const getEncryptionKeys = (): Buffer[] =>
    [
        decodeKey(environment.CLASSLINK_PII_KEY),
        decodeKey(environment.CLASSLINK_PII_KEY_PREVIOUS),
    ].filter((key): key is Buffer => key !== null);

let identityKeyFallbackWarned = false;

/**
 * The permanent identity HMAC key. CLASSLINK_IDENTITY_KEY must never be rotated: it
 * derives every identity key and new Firebase UID. Until it is set, CLASSLINK_PII_KEY is
 * used (logged once) so identities created before the split keep resolving; set
 * CLASSLINK_IDENTITY_KEY to that same value before rotating CLASSLINK_PII_KEY.
 *
 * The fallback is refused while CLASSLINK_PII_KEY_PREVIOUS is set: that means
 * CLASSLINK_PII_KEY has been rotated, so it would derive different identity keys and UIDs
 * for every student (new empty accounts or CONFLICT lockouts). School sign-in fails closed
 * until CLASSLINK_IDENTITY_KEY is set to the pre-rotation key.
 */
const getIdentityKey = (): Buffer | null => {
    const explicit = environment.CLASSLINK_IDENTITY_KEY?.trim();
    if (explicit) return decodeKey(explicit);
    if (decodeKey(environment.CLASSLINK_PII_KEY_PREVIOUS)) {
        console.warn('classlink.identity_key.fallback_during_rotation');
        return null;
    }
    const fallback = decodeKey(environment.CLASSLINK_PII_KEY);
    if (fallback && !identityKeyFallbackWarned) {
        identityKeyFallbackWarned = true;
        console.warn('classlink.identity_key.fallback');
    }
    return fallback;
};

/** Domain-separated identity HMAC; an unusable key disables school sign-in. */
const identityHmac = (value: string): Buffer => {
    const key = getIdentityKey();
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
const getAad = (identityKey: string, version: string, kid?: string): Buffer =>
    Buffer.from(
        JSON.stringify(
            kid === undefined
                ? [PURPOSE, version, identityKey]
                : [PURPOSE, version, kid, identityKey]
        )
    );

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
    const key = decodeKey(environment.CLASSLINK_PII_KEY);
    if (!key) {
        console.warn('classlink.pii.key_missing');
        return null;
    }
    const kid = keyId(key);
    const iv = randomBytes(IV_LENGTH);
    const plaintext = Buffer.from(value, 'utf8');
    try {
        const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: TAG_LENGTH });
        cipher.setAAD(getAad(identityKey, PAYLOAD_VERSION, kid));
        const sealed = Buffer.concat([
            iv,
            cipher.update(plaintext),
            cipher.final(),
            cipher.getAuthTag(),
        ]);
        return {
            stateStudentIdEnc: `${PAYLOAD_VERSION}:${kid}:${sealed.toString('base64')}`,
            stateStudentIdExpiresAt: expiresAt,
        };
    } finally {
        plaintext.fill(0);
        key.fill(0);
    }
};

const decrypt = (bytes: Buffer, key: Buffer, aad: Buffer): string | null => {
    try {
        const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, IV_LENGTH), {
            authTagLength: TAG_LENGTH,
        });
        decipher.setAAD(aad);
        decipher.setAuthTag(bytes.subarray(-TAG_LENGTH));
        const plaintext = Buffer.concat([
            decipher.update(bytes.subarray(IV_LENGTH, -TAG_LENGTH)),
            decipher.final(),
        ]);
        const value = plaintext.toString('utf8');
        plaintext.fill(0);
        return value || null;
    } catch {
        return null;
    }
};

/** Reads `v2:<kid>:<b64>` with the matching current or previous key, and legacy `v1:<b64>`. */
const openStateStudentId = (payload: string, identityKey: string): string | null => {
    const parts = payload.split(':');
    const version = parts[0];
    let kid: string | undefined;
    let encoded: string | undefined;
    if (version === PAYLOAD_VERSION && parts.length === 3) [, kid, encoded] = parts;
    else if (version === LEGACY_PAYLOAD_VERSION && parts.length === 2) [, encoded] = parts;
    else return null;
    if (!encoded) return null;
    const bytes = Buffer.from(encoded, 'base64');
    if (bytes.length <= IV_LENGTH + TAG_LENGTH) return null;
    const keys = getEncryptionKeys();
    if (!keys.length) {
        console.warn('classlink.pii.key_missing');
        return null;
    }
    try {
        const candidates = kid === undefined ? keys : keys.filter(key => keyId(key) === kid);
        for (const key of candidates) {
            const value = decrypt(bytes, key, getAad(identityKey, version, kid));
            if (value !== null) return value;
        }
        // A wrong or retired key, or a ciphertext moved between records. Never log the payload.
        console.warn('classlink.pii.decrypt_failed');
        return null;
    } finally {
        keys.forEach(key => key.fill(0));
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
