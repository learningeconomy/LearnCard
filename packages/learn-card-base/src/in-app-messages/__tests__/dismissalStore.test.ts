import {
    markMessageSeen,
    resetInAppMessageDismissals,
    shouldSuppressMessage,
} from '../dismissalStore';

describe('dismissalStore account isolation', () => {
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
        resetInAppMessageDismissals();
    });

    it('does not suppress the same campaign for a different account', () => {
        const now = Date.parse('2026-10-14T12:00:00Z');

        markMessageSeen('campaign', 'once', now, 'did:example:alice');

        expect(shouldSuppressMessage('campaign', 'once', now, 'did:example:alice')).toBe(true);
        expect(shouldSuppressMessage('campaign', 'once', now, 'did:example:bob')).toBe(false);
    });
});
