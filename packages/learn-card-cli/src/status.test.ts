import { describe, expect, it } from 'vitest';
import { formatEvent, summarize } from './status';

const created = {
    activityId: 'a1',
    eventType: 'CREATED',
    timestamp: '2026-09-11T18:12:27.116Z',
    recipientType: 'email',
    recipientIdentifier: 'jane@example.com',
    boost: { name: 'Quickstart Complete' },
};

describe('status', () => {
    it('reports the latest event as the state and keeps the chain newest-first', () => {
        const claimed = {
            ...created,
            eventType: 'CLAIMED',
            timestamp: '2026-09-11T18:20:00.000Z',
            credentialUri: 'lc:network:x/trpc:credential:1',
        };
        const s = summarize([created, claimed]);
        expect(s.state).toBe('CLAIMED');
        expect(s.credentialUri).toBe('lc:network:x/trpc:credential:1');
        expect(s.events.map(e => e.type)).toEqual(['CLAIMED', 'CREATED']);
    });

    it('surfaces the failure reason on FAILED events', () => {
        const failed = { ...created, eventType: 'FAILED', metadata: { error: 'bad email' } };
        expect(formatEvent(failed)).toContain('FAILED');
        expect(formatEvent(failed)).toContain('bad email');
        expect(summarize([failed]).events[0]).toMatchObject({ type: 'FAILED', error: 'bad email' });
    });
});
