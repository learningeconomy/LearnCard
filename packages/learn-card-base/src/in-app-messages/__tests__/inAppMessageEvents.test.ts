import {
    clearInAppMessageEvents,
    emitInAppMessageEvent,
    getRecentInAppMessageEvents,
} from '../inAppMessageEvents';

describe('inAppMessageEvents', () => {
    beforeEach(clearInAppMessageEvents);

    it('retains at most 50 events and prunes events older than 30 minutes', () => {
        const now = Date.parse('2026-10-14T12:00:00Z');

        emitInAppMessageEvent('app.opened', { occurredAt: now - 31 * 60 * 1000 });
        for (let index = 0; index < 55; index += 1) {
            emitInAppMessageEvent('app.opened', { occurredAt: now + index });
        }

        const recent = getRecentInAppMessageEvents(undefined, now + 100);

        expect(recent).toHaveLength(50);
        expect(recent.every(event => event.occurredAt >= now)).toBe(true);
    });

    it('isolates account-scoped events', () => {
        emitInAppMessageEvent('app.opened', { accountDid: 'did:example:one' });
        emitInAppMessageEvent('app.opened', { accountDid: 'did:example:two' });

        expect(getRecentInAppMessageEvents('did:example:one')).toHaveLength(1);
        expect(getRecentInAppMessageEvents('did:example:two')).toHaveLength(1);
    });
});
