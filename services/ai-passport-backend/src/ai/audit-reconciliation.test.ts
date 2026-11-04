import { expect, mock, test } from 'bun:test';

const events: string[] = [];
const reconcile = mock(async (_before: Date) => 0);
mock.module('./audit', () => ({ reconcileInterruptedAiAudits: reconcile }));
mock.module('../logging', () => ({
    logSafeEvent: (_level: string, event: string) => {
        events.push(event);
    },
}));

// Import after mocks to isolate durable-store availability and timer behavior.
const { startAiAuditReconciliation } = await import('./audit-reconciliation');

test('fails closed at startup and schedules nonoverlapping recovery after success or periodic failure', async () => {
    const originalSetTimeout = globalThis.setTimeout;
    const scheduled: { callback: () => Promise<void>; delay: number }[] = [];
    globalThis.setTimeout = ((callback: () => Promise<void>, delay: number) => {
        scheduled.push({ callback, delay });
        return { unref() {} };
    }) as unknown as typeof setTimeout;

    try {
        reconcile.mockRejectedValueOnce(new Error('private database details'));
        await expect(startAiAuditReconciliation()).rejects.toThrow(
            'AI audit reconciliation unavailable'
        );
        expect(events).toEqual(['ai_audit_reconciliation_failed']);
        expect(scheduled).toEqual([]);

        let release!: (count: number) => void;
        reconcile.mockImplementationOnce(
            () =>
                new Promise<number>(resolve => {
                    release = resolve;
                })
        );
        const startup = startAiAuditReconciliation();
        const duplicate = startAiAuditReconciliation();
        expect(scheduled).toEqual([]);
        release(2);
        await Promise.all([startup, duplicate]);
        // One startup sweep despite two bootstrap callers, then one future sweep.
        expect(reconcile).toHaveBeenCalledTimes(2);
        expect(scheduled).toHaveLength(1);
        expect(scheduled[0].delay).toBeGreaterThanOrEqual(60_000);
        expect(reconcile.mock.calls[1][0].getTime()).toBeLessThan(Date.now() - 60 * 60 * 1_000);

        reconcile.mockImplementationOnce(
            () =>
                new Promise<number>(resolve => {
                    release = resolve;
                })
        );
        const firstPeriodic = scheduled.shift()!.callback();
        expect(scheduled).toEqual([]);
        release(1);
        await firstPeriodic;
        expect(scheduled).toHaveLength(1);

        reconcile.mockRejectedValueOnce(new Error('private database details'));
        await scheduled.shift()!.callback();
        expect(events.at(-1)).toBe('ai_audit_reconciliation_failed');
        expect(scheduled).toHaveLength(1);
        expect(JSON.stringify(events)).not.toContain('private database details');
    } finally {
        globalThis.setTimeout = originalSetTimeout;
    }
});
