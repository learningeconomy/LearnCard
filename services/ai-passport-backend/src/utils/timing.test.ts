import { describe, expect, it, mock } from 'bun:test';

import { createRequestTiming, type TimingData } from './timing';

describe('createRequestTiming', () => {
    it('correlates monotonic marks and emits only the first visible delta', () => {
        const times = [100, 125.4, 160.7, 190.2];
        const sent: TimingData[] = [];
        const send = mock((timing: TimingData) => sent.push(timing));
        const ws = { readyState: WebSocket.OPEN, send: mock(() => undefined) };
        const timing = createRequestTiming({
            ws: ws as never,
            requestId: 'request-1',
            action: 'start_topic',
            now: () => times.shift() ?? 190.2,
            send,
        });

        timing.mark('session.received');
        timing.markFirstDelta({ field: 'welcome' });
        timing.markFirstDelta({ field: 'summary' });

        expect(sent).toHaveLength(2);
        expect(sent[0]).toMatchObject({
            requestId: 'request-1',
            action: 'start_topic',
            operation: 'session.received',
            phase: 'complete',
            duration: 25,
        });
        expect(sent[1]).toMatchObject({
            requestId: 'request-1',
            action: 'start_topic',
            operation: 'plan.first_delta',
            duration: 61,
            metadata: { field: 'welcome' },
        });
    });
});
