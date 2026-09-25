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

import {
    canAttemptSharePasscode,
    recordFailedSharePasscode,
} from '../src/helpers/share-link-passcode-abuse';
import { claimShareViewNotification } from '../src/helpers/share-link-view-notification';

beforeEach(() => store.clear());

describe('share-link abuse windows', () => {
    it('bounds failures per source and across rotating source addresses, then recovers', async () => {
        for (let index = 0; index < 6; index++) {
            expect(await canAttemptSharePasscode('ns', 'share', 'source-a')).toBe(true);
            await recordFailedSharePasscode('ns', 'share', 'source-a');
        }
        expect(await canAttemptSharePasscode('ns', 'share', 'source-a')).toBe(false);
        expect(await canAttemptSharePasscode('ns', 'share', 'source-b')).toBe(true);
        for (let index = 0; index < 18; index++) {
            await recordFailedSharePasscode('ns', 'share', `rotating-${index}`);
        }
        expect(await canAttemptSharePasscode('ns', 'share', 'fresh-source')).toBe(false);
        store.clear(); // Redis expiry at the end of the one-minute window.
        expect(await canAttemptSharePasscode('ns', 'share', 'source-a')).toBe(true);
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
