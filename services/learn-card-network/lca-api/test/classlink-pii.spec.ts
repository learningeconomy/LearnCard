import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash, createHmac } from 'node:crypto';

const { env } = vi.hoisted(() => ({
    env: { CLASSLINK_PII_KEY: undefined as string | undefined },
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

beforeEach(() => {
    env.CLASSLINK_PII_KEY = KEY;
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
        expect(sealed.stateStudentIdEnc).toMatch(/^v1:/);
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
        const bytes = Buffer.from(sealed.stateStudentIdEnc.slice(3), 'base64');
        bytes.writeUInt8(bytes.readUInt8(bytes.length - 1) ^ 1, bytes.length - 1);
        expect(
            getStateStudentId({
                identityKey,
                ...sealed,
                stateStudentIdEnc: `v1:${bytes.toString('base64')}`,
            })
        ).toBeNull();
        expect(
            getStateStudentId({
                identityKey,
                ...sealed,
                stateStudentIdEnc: sealed.stateStudentIdEnc.replace('v1:', 'v2:'),
            })
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
});
