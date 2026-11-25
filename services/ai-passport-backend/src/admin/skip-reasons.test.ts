import { expect, test } from 'bun:test';
import { recordSkip, skipSummary, type SkipCounters } from './skip-reasons';
test('allowlisted reasons exclude injected fields and honestly retain legacy counts', () => {
    const job: SkipCounters & { dryRun: boolean } = { dryRun: false, skipped: 2 };
    recordSkip(job, 'missing_source');
    expect(skipSummary(job).unknownHistorical).toBe(2);
    expect(skipSummary(job).reasons).toEqual([
        { code: 'missing_source', label: 'Source no longer present', count: 1 },
    ]);
    expect(
        skipSummary({
            ...job,
            skipReasons: { ...job.skipReasons, secret: 3 } as never,
        }).reasons
    ).toHaveLength(1);
});
test('legacy and new dry-run observations remain planning rather than skips', () => {
    expect(skipSummary({ dryRun: true, skipped: 3, dryRunObserved: 2 })).toEqual({
        observed: 5,
        reasons: [],
        unknownHistorical: 0,
    });
});
