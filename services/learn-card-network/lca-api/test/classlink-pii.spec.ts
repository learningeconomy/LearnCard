import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createCipheriv, createHash, createHmac } from 'node:crypto';

const { env } = vi.hoisted(() => ({
    env: {
        CLASSLINK_PII_KEY: undefined as string | undefined,
        CLASSLINK_PII_KEY_PREVIOUS: undefined as string | undefined,
        CLASSLINK_IDENTITY_KEY: undefined as string | undefined,
    },
}));
vi.mock('@environment', () => ({ environment: env }));

import {
    classLinkSubjectDigest,
    classLinkFirebaseUid,
    getStateStudentId,
    hasExpiredStateStudentId,
    sealStateStudentId,
} from '../src/helpers/classlinkPii.helpers';

const KEY = Buffer.alloc(32, 7).toString('base64');
const identityKey = 'classlink:tenant-test:source-1';
const seal = (value: string | null = 'state-1', maxAgeSeconds = 3600) =>
    sealStateStudentId(value, identityKey, new Date(), maxAgeSeconds);

const OTHER_KEY = Buffer.alloc(32, 8).toString('base64');
const IDENTITY_KEY = Buffer.alloc(32, 9).toString('base64');

beforeEach(() => {
    env.CLASSLINK_PII_KEY = KEY;
    env.CLASSLINK_PII_KEY_PREVIOUS = undefined;
    env.CLASSLINK_IDENTITY_KEY = undefined;
});
afterEach(() => vi.restoreAllMocks());

describe('ClassLink state student ID encryption', () => {
    it('uses a domain-separated keyed identity and UID', () => {
        const value = JSON.stringify(['tenant-test', 'source-1']);
        const subKey = createHmac('sha256', Buffer.from(KEY, 'base64'))
            .update('classlink-identity-v1')
            .digest();
        const digest = classLinkSubjectDigest('tenant-test', 'source-1');
        expect(digest).toBe(createHmac('sha256', subKey).update(value).digest('base64url'));
        expect(digest).toBe(classLinkSubjectDigest('tenant-test', 'source-1'));
        expect(digest).not.toBe(createHash('sha256').update(value).digest('base64url'));
        const opaqueKey = `classlink:tenant-test:v1:${digest}`;
        expect(opaqueKey).not.toContain('source-1');
        expect(classLinkFirebaseUid(opaqueKey)).toBe(
            `classlink_${createHmac('sha256', subKey).update(opaqueKey).digest('hex').slice(0, 28)}`
        );
        env.CLASSLINK_PII_KEY = Buffer.alloc(32, 8).toString('base64');
        expect(classLinkSubjectDigest('tenant-test', 'source-1')).not.toBe(digest);
    });
    it('round-trips a versioned payload that does not contain the value', () => {
        const sealed = seal()!;
        expect(sealed.stateStudentIdEnc).toMatch(/^v2:[0-9a-f]{8}:/);
        expect(sealed.stateStudentIdEnc).not.toContain('state-1');
        expect(getStateStudentId({ identityKey, ...sealed })).toBe('state-1');
    });

    it('uses a fresh IV for every value', () => {
        expect(seal()!.stateStudentIdEnc).not.toBe(seal()!.stateStudentIdEnc);
    });

    it('stores nothing for an empty value or an already-expired window', () => {
        expect(seal(null)).toBeNull();
        expect(sealStateStudentId('state-1', identityKey, new Date(0), 3600)).toBeNull();
    });

    it.each([undefined, '', 'not-base64!', Buffer.alloc(16).toString('base64')])(
        'stores nothing and logs only the event name when the key is %j',
        key => {
            env.CLASSLINK_PII_KEY = key;
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
            expect(seal()).toBeNull();
            expect(warn).toHaveBeenCalledExactlyOnceWith('classlink.pii.key_missing');
        }
    );

    it('returns null for an expired, tampered, foreign or unknown-version payload', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const sealed = seal()!;
        const past = new Date(Date.now() - 1000);
        expect(
            getStateStudentId({ identityKey, ...sealed, stateStudentIdExpiresAt: past })
        ).toBeNull();
        expect(getStateStudentId({ identityKey: 'classlink:other:1', ...sealed })).toBeNull();
        const [version, kid, encoded] = sealed.stateStudentIdEnc.split(':');
        const bytes = Buffer.from(encoded!, 'base64');
        bytes.writeUInt8(bytes.readUInt8(bytes.length - 1) ^ 1, bytes.length - 1);
        expect(
            getStateStudentId({
                identityKey,
                ...sealed,
                stateStudentIdEnc: `${version}:${kid}:${bytes.toString('base64')}`,
            })
        ).toBeNull();
        expect(
            getStateStudentId({
                identityKey,
                ...sealed,
                stateStudentIdEnc: sealed.stateStudentIdEnc.replace('v2:', 'v9:'),
            })
        ).toBeNull();
        // A v2 payload cannot be replayed as v1 (the version is bound into the AAD).
        expect(
            getStateStudentId({ identityKey, ...sealed, stateStudentIdEnc: `v1:${encoded}` })
        ).toBeNull();
        env.CLASSLINK_PII_KEY = Buffer.alloc(32, 8).toString('base64');
        expect(getStateStudentId({ identityKey, ...sealed })).toBeNull();
    });

    it('flags expired, unexpiring and legacy plaintext records for removal', () => {
        const sealed = seal()!;
        expect(hasExpiredStateStudentId(sealed)).toBe(false);
        expect(hasExpiredStateStudentId({})).toBe(false);
        expect(hasExpiredStateStudentId({ stateStudentId: null })).toBe(true);
        expect(hasExpiredStateStudentId({ stateStudentIdEnc: sealed.stateStudentIdEnc })).toBe(
            true
        );
        expect(
            hasExpiredStateStudentId({
                ...sealed,
                stateStudentIdExpiresAt: new Date(Date.now() - 1000),
            })
        ).toBe(true);
    });

    it('still reads legacy v1 payloads sealed before key ids', () => {
        const key = Buffer.from(KEY, 'base64');
        const iv = Buffer.alloc(12, 1);
        const cipher = createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
        cipher.setAAD(
            Buffer.from(JSON.stringify(['classlink-state-student-id', 'v1', identityKey]))
        );
        const sealed = Buffer.concat([
            iv,
            cipher.update('legacy-state'),
            cipher.final(),
            cipher.getAuthTag(),
        ]);
        const legacy = {
            identityKey,
            stateStudentIdEnc: `v1:${sealed.toString('base64')}`,
            stateStudentIdExpiresAt: new Date(Date.now() + 60_000),
        };
        expect(getStateStudentId(legacy)).toBe('legacy-state');
        // ...including after the key moved to CLASSLINK_PII_KEY_PREVIOUS.
        env.CLASSLINK_PII_KEY = OTHER_KEY;
        env.CLASSLINK_PII_KEY_PREVIOUS = KEY;
        expect(getStateStudentId(legacy)).toBe('legacy-state');
    });

    it('decrypts with CLASSLINK_PII_KEY_PREVIOUS during rotation and seals with the new key', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const old = seal()!;
        env.CLASSLINK_PII_KEY = OTHER_KEY;
        expect(getStateStudentId({ identityKey, ...old })).toBeNull();
        env.CLASSLINK_PII_KEY_PREVIOUS = KEY;
        expect(getStateStudentId({ identityKey, ...old })).toBe('state-1');
        const fresh = seal()!;
        expect(fresh.stateStudentIdEnc.split(':')[1]).not.toBe(old.stateStudentIdEnc.split(':')[1]);
        env.CLASSLINK_PII_KEY_PREVIOUS = undefined;
        expect(getStateStudentId({ identityKey, ...fresh })).toBe('state-1');
    });
});

describe('ClassLink identity key', () => {
    const digestWith = (key: string): string => {
        const subKey = createHmac('sha256', Buffer.from(key, 'base64'))
            .update('classlink-identity-v1')
            .digest();
        return createHmac('sha256', subKey)
            .update(JSON.stringify(['tenant-test', 'source-1']))
            .digest('base64url');
    };

    it('uses CLASSLINK_IDENTITY_KEY when set, so CLASSLINK_PII_KEY can rotate freely', () => {
        env.CLASSLINK_IDENTITY_KEY = IDENTITY_KEY;
        const digest = classLinkSubjectDigest('tenant-test', 'source-1');
        expect(digest).toBe(digestWith(IDENTITY_KEY));
        env.CLASSLINK_PII_KEY = OTHER_KEY;
        expect(classLinkSubjectDigest('tenant-test', 'source-1')).toBe(digest);
        env.CLASSLINK_PII_KEY = undefined;
        expect(classLinkSubjectDigest('tenant-test', 'source-1')).toBe(digest);
    });

    it('falls back to CLASSLINK_PII_KEY with a one-time warning, preserving existing identities', async () => {
        vi.resetModules();
        const fresh = await import('../src/helpers/classlinkPii.helpers');
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(fresh.classLinkSubjectDigest('tenant-test', 'source-1')).toBe(digestWith(KEY));
        fresh.classLinkSubjectDigest('tenant-test', 'source-2');
        expect(warn).toHaveBeenCalledExactlyOnceWith('classlink.identity_key.fallback');
        // Setting the identity key to the old PII key keeps identities stable after the split.
        env.CLASSLINK_IDENTITY_KEY = KEY;
        env.CLASSLINK_PII_KEY = OTHER_KEY;
        expect(fresh.classLinkSubjectDigest('tenant-test', 'source-1')).toBe(digestWith(KEY));
    });

    it('refuses the CLASSLINK_PII_KEY fallback while a rotation is in progress', () => {
        // Rotated without first pinning CLASSLINK_IDENTITY_KEY to the old PII key.
        env.CLASSLINK_PII_KEY = OTHER_KEY;
        env.CLASSLINK_PII_KEY_PREVIOUS = KEY;
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(() => classLinkSubjectDigest('tenant-test', 'source-1')).toThrow(
            expect.objectContaining({ code: 'PRECONDITION_FAILED' })
        );
        expect(() => classLinkFirebaseUid('classlink:tenant-test:v1:x')).toThrow(
            expect.objectContaining({ code: 'PRECONDITION_FAILED' })
        );
        expect(warn).toHaveBeenCalledWith('classlink.identity_key.fallback_during_rotation');
        // Pinning the identity key to the pre-rotation key restores the original identities.
        env.CLASSLINK_IDENTITY_KEY = KEY;
        expect(classLinkSubjectDigest('tenant-test', 'source-1')).toBe(digestWith(KEY));
    });

    it('fails closed for an invalid CLASSLINK_IDENTITY_KEY rather than falling back', () => {
        env.CLASSLINK_IDENTITY_KEY = 'not-a-key';
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        expect(() => classLinkSubjectDigest('tenant-test', 'source-1')).toThrow(
            expect.objectContaining({ code: 'PRECONDITION_FAILED' })
        );
        expect(warn).toHaveBeenCalledWith('classlink.pii.key_missing');
    });
});
