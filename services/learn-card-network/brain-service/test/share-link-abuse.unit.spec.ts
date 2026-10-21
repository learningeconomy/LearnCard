import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => new Map<string, number>());
vi.mock('@cache', () => ({
    default: {
        get: async (key: string) => (store.has(key) ? String(store.get(key)) : null),
        incr: async (key: string) => {
            const next = (store.get(key) ?? 0) + 1;
            store.set(key, next);
            return next;
        },
    },
}));

import { reserveSharePasscodeAttempt } from '../src/helpers/share-link-passcode-abuse';
import { claimShareViewNotification } from '../src/helpers/share-link-view-notification';

beforeEach(() => store.clear());

describe('share-link abuse windows', () => {
    it('bounds attempts per source and across rotating source addresses, then recovers', async () => {
        for (let index = 0; index < 6; index++) {
            expect(await reserveSharePasscodeAttempt('ns', 'share', 'source-a')).toBe(true);
        }
        expect(await reserveSharePasscodeAttempt('ns', 'share', 'source-a')).toBe(false);
        expect(store.get('share-link-passcode-attempt:ns:share')).toBe(6);
        expect(await reserveSharePasscodeAttempt('ns', 'share', 'source-b')).toBe(true);
        for (let index = 0; index < 17; index++) {
            await reserveSharePasscodeAttempt('ns', 'share', `rotating-${index}`);
        }
        expect(await reserveSharePasscodeAttempt('ns', 'share', 'fresh-source')).toBe(false);
        store.clear(); // Redis expiry at the end of the one-minute window.
        expect(await reserveSharePasscodeAttempt('ns', 'share', 'source-a')).toBe(true);
    });

    it('does not let one over-limit source consume the shared budget', async () => {
        const attempts = await Promise.all(
            Array.from({ length: 30 }, () =>
                reserveSharePasscodeAttempt('ns', 'single-source', 'source-a')
            )
        );
        expect(attempts.filter(Boolean)).toHaveLength(6);
        expect(store.get('share-link-passcode-attempt:ns:single-source')).toBe(6);
        expect(await reserveSharePasscodeAttempt('ns', 'single-source', 'source-b')).toBe(true);
    });

    it('admits at most 24 concurrent verifications across rotated sources', async () => {
        const admitted = await Promise.all(
            Array.from({ length: 50 }, (_, index) =>
                reserveSharePasscodeAttempt('ns', 'burst', `source-${index}`)
            )
        );
        expect(admitted.filter(Boolean)).toHaveLength(24);
    });

    it('atomically claims only one owner notification per share window', async () => {
        const claims = await Promise.all(
            Array.from({ length: 20 }, () => claimShareViewNotification('ns', 'share'))
        );
        expect(claims.filter(Boolean)).toHaveLength(1);
        expect(await claimShareViewNotification('ns', 'another-share')).toBe(true);
        store.clear();
        expect(await claimShareViewNotification('ns', 'share')).toBe(true);
    });
});
