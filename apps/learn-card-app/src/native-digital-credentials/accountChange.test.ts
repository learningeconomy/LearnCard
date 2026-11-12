import { describe, expect, it } from 'vitest';
import { nativeAccountChanged } from './accountChange';

describe('native account invalidation boundary', () => {
    const restored = {
        currentUser: { uid: 'account', privateKey: 'test-key-a' },
        currentUserPK: 'test-key-a',
    };
    it('preserves a platform request while the same cold account hydrates its key', () => {
        const initial = { currentUser: { uid: 'account' }, currentUserPK: null };
        expect(nativeAccountChanged(restored, initial)).toBe(false);
        expect(nativeAccountChanged({ ...restored }, restored)).toBe(false);
    });
    it('allows a cached social UID to be replaced during key restoration, before owner verification', () => {
        const cached = { currentUser: { uid: 'social-provider-uid' }, currentUserPK: null };
        expect(
            nativeAccountChanged(
                { ...restored, currentUser: { uid: '', privateKey: 'test-key-a' } },
                cached
            )
        ).toBe(false);
        // A different seed is rejected by the persisted-owner check, not by a profile UID.
        expect(
            nativeAccountChanged(
                { ...restored, currentUser: { uid: '', privateKey: 'test-key-b' } },
                cached
            )
        ).toBe(false);
        expect(nativeAccountChanged({ currentUser: null, currentUserPK: null }, cached)).toBe(true);
    });
    it('invalidates a key/account replacement immediately, before a replacement wallet exists', () => {
        expect(
            nativeAccountChanged(
                {
                    currentUser: { uid: 'account', privateKey: 'test-key-b' },
                    currentUserPK: 'test-key-a',
                },
                restored
            )
        ).toBe(true);
        expect(
            nativeAccountChanged(
                { ...restored, currentUser: { ...restored.currentUser, uid: 'other' } },
                restored
            )
        ).toBe(true);
    });
    it('invalidates logout and removal of the last established key source', () => {
        expect(nativeAccountChanged({ currentUser: null, currentUserPK: null }, restored)).toBe(
            true
        );
        expect(
            nativeAccountChanged({ currentUser: { uid: 'account' }, currentUserPK: null }, restored)
        ).toBe(true);
        expect(
            nativeAccountChanged({ ...restored, currentUser: { uid: 'account' } }, restored)
        ).toBe(false);
        expect(nativeAccountChanged({ ...restored, currentUserPK: null }, restored)).toBe(false);
    });
});
