import { beforeEach, describe, expect, it } from 'vitest';

import {
    acquireSocialLoginLock,
    refreshSocialLoginLock,
    releaseSocialLoginLock,
    SOCIAL_LOGIN_LOCK_KEY,
    SOCIAL_LOGIN_LOCK_TTL_MS,
} from './socialLoginLock';

describe('socialLoginLock', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('permits one owner and only lets that owner release the lease', () => {
        expect(acquireSocialLoginLock('tab-a', { now: 1_000, storage: localStorage })).toBe(true);
        expect(acquireSocialLoginLock('tab-b', { now: 1_001, storage: localStorage })).toBe(false);

        releaseSocialLoginLock('tab-b', localStorage);
        expect(acquireSocialLoginLock('tab-b', { now: 1_002, storage: localStorage })).toBe(false);

        releaseSocialLoginLock('tab-a', localStorage);
        expect(acquireSocialLoginLock('tab-b', { now: 1_003, storage: localStorage })).toBe(true);
        releaseSocialLoginLock('tab-b', localStorage);
    });

    it('recovers an expired lease without allowing the old owner to release the new one', () => {
        expect(acquireSocialLoginLock('stale-tab', { now: 1_000, storage: localStorage })).toBe(
            true
        );

        const afterExpiry = 1_000 + SOCIAL_LOGIN_LOCK_TTL_MS + 1;
        expect(acquireSocialLoginLock('new-tab', { now: afterExpiry, storage: localStorage })).toBe(
            true
        );

        releaseSocialLoginLock('stale-tab', localStorage);
        expect(
            acquireSocialLoginLock('third-tab', { now: afterExpiry + 1, storage: localStorage })
        ).toBe(false);
        releaseSocialLoginLock('new-tab', localStorage);
    });

    it('renews the current lease without letting an old owner overwrite its successor', () => {
        const startedAt = 1_000;
        const refreshedAt = startedAt + SOCIAL_LOGIN_LOCK_TTL_MS - 1;

        expect(acquireSocialLoginLock('tab-a', { now: startedAt, storage: localStorage })).toBe(
            true
        );
        expect(refreshSocialLoginLock('tab-a', { now: refreshedAt, storage: localStorage })).toBe(
            true
        );
        expect(
            acquireSocialLoginLock('tab-b', {
                now: startedAt + SOCIAL_LOGIN_LOCK_TTL_MS + 1,
                storage: localStorage,
            })
        ).toBe(false);

        const refreshedExpiry = refreshedAt + SOCIAL_LOGIN_LOCK_TTL_MS;
        releaseSocialLoginLock('tab-a', localStorage);
        expect(
            acquireSocialLoginLock('tab-b', { now: refreshedExpiry + 1, storage: localStorage })
        ).toBe(true);
        expect(
            refreshSocialLoginLock('tab-a', {
                now: refreshedExpiry + 2,
                storage: localStorage,
            })
        ).toBe(false);
        releaseSocialLoginLock('tab-b', localStorage);
    });

    it('falls back to a document-wide guard when storage is unavailable', () => {
        const unavailableStorage = {
            getItem: () => {
                throw new Error('Storage unavailable');
            },
        } as unknown as Storage;

        expect(acquireSocialLoginLock('tab-a', { storage: unavailableStorage })).toBe(true);
        expect(acquireSocialLoginLock('tab-b', { storage: unavailableStorage })).toBe(false);

        releaseSocialLoginLock('tab-a', null);
        expect(acquireSocialLoginLock('tab-b', { storage: unavailableStorage })).toBe(true);
        releaseSocialLoginLock('tab-b', null);
    });

    it('recovers malformed and implausibly long leases', () => {
        localStorage.setItem(SOCIAL_LOGIN_LOCK_KEY, '{not-json');
        expect(acquireSocialLoginLock('tab-a', { now: 1_000, storage: localStorage })).toBe(true);
        releaseSocialLoginLock('tab-a', localStorage);

        localStorage.setItem(
            SOCIAL_LOGIN_LOCK_KEY,
            JSON.stringify({ ownerId: 'bad-tab', expiresAt: Number.MAX_SAFE_INTEGER })
        );
        expect(acquireSocialLoginLock('tab-b', { now: 1_001, storage: localStorage })).toBe(true);
        releaseSocialLoginLock('tab-b', localStorage);
    });
});
