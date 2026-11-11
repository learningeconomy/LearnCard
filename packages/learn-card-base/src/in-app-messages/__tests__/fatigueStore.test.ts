import type { InAppMessage, InAppMessageSettings } from '@learncard/types';

import {
    canShowBlocking,
    isFatigueControlled,
    recordBlockingShown,
    resetInAppMessageFatigue,
    shouldSuppressByFatigue,
} from '../fatigueStore';

const settings: InAppMessageSettings = {
    maxBlockingPerSession: 1,
    blockingCooldownHours: 48,
};

const message = (overrides: Partial<InAppMessage> = {}): InAppMessage => ({
    id: 'blocking',
    priority: 0,
    dismissible: true,
    frequency: 'always',
    presentation: 'modal',
    title: 'Blocking',
    actions: [],
    enabled: true,
    bypassFatigue: false,
    ...overrides,
});

describe('fatigueStore', () => {
    beforeEach(() => {
        const values = new Map<string, string>();

        Object.defineProperty(globalThis, 'localStorage', {
            configurable: true,
            value: {
                getItem: (key: string) => values.get(key) ?? null,
                setItem: (key: string, value: string) => values.set(key, value),
                removeItem: (key: string) => values.delete(key),
            },
        });
        resetInAppMessageFatigue();
    });

    it('enforces the session cap and persisted cooldown', () => {
        const now = Date.parse('2026-10-14T12:00:00Z');

        expect(canShowBlocking(settings, now)).toBe(true);
        recordBlockingShown(now);
        expect(canShowBlocking(settings, now + 49 * 60 * 60 * 1000)).toBe(false);

        resetInAppMessageFatigue();
        recordBlockingShown(now);
        expect(
            canShowBlocking(
                { maxBlockingPerSession: 2, blockingCooldownHours: 48 },
                now + 47 * 60 * 60 * 1000
            )
        ).toBe(false);
    });

    it('does not fatigue banners, toasts, required messages, or bypass messages', () => {
        expect(isFatigueControlled(message({ presentation: 'banner' }))).toBe(false);
        expect(isFatigueControlled(message({ presentation: 'toast' }))).toBe(false);
        expect(isFatigueControlled(message({ dismissible: false }))).toBe(false);
        expect(isFatigueControlled(message({ bypassFatigue: true }))).toBe(false);

        recordBlockingShown();

        expect(shouldSuppressByFatigue(message({ presentation: 'banner' }), settings)).toBe(false);
        expect(shouldSuppressByFatigue(message({ presentation: 'toast' }), settings)).toBe(false);
        expect(shouldSuppressByFatigue(message({ dismissible: false }), settings)).toBe(false);
        expect(shouldSuppressByFatigue(message({ bypassFatigue: true }), settings)).toBe(false);
    });

    it('isolates session caps and cooldowns by account', () => {
        const now = Date.parse('2026-10-14T12:00:00Z');

        recordBlockingShown(now, 'did:example:alice');

        expect(canShowBlocking(settings, now, 'did:example:alice')).toBe(false);
        expect(canShowBlocking(settings, now, 'did:example:bob')).toBe(true);
    });
});
