import { afterEach, expect, test } from 'bun:test';

process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 7).toString('base64');

const {
    CREDENTIAL_READ_FLOOR_MS,
    credentialBudgetAllowsStart,
    credentialReadTimeoutMs,
    credentialSlowReadMs,
    credentialUriHash,
    synthesisReserveMs,
} = await import('./read-budget');
const { logSafeEvent } = await import('../logging');

afterEach(() => {
    delete process.env.CREDENTIAL_READ_TIMEOUT_MS;
});

test('without a request deadline a read keeps LEARNCARD_CALL_TIMEOUT_MS and always starts', () => {
    expect(credentialReadTimeoutMs()).toBeUndefined();
    expect(credentialBudgetAllowsStart()).toBe(true);
});

test('a read gets the cap or the time left before the synthesis reserve', () => {
    const budget = { deadlineAt: 20_000, budgetMs: 20_000 };
    // 20s budget: 8s reserve. At 2s in, 10s left: capped at 3s.
    expect(credentialReadTimeoutMs({ now: 2_000, budget })).toBe(3_000);
    // At 10s in, 2s left before the reserve.
    expect(credentialReadTimeoutMs({ now: 10_000, budget })).toBe(2_000);
    process.env.CREDENTIAL_READ_TIMEOUT_MS = '1500';
    expect(credentialReadTimeoutMs({ now: 2_000, budget })).toBe(1_500);
    // A spent budget still gets the floor, never the 250ms that split prod reads.
    expect(credentialReadTimeoutMs({ now: 19_000, budget })).toBe(CREDENTIAL_READ_FLOOR_MS);
});

test('the batch stops starting credentials a task could not finish before the reserve', () => {
    const budget = { deadlineAt: 20_000, budgetMs: 20_000 };
    // Unmeasured: configured 8s reserve, at most 60% of the budget.
    expect(synthesisReserveMs(budget)).toBe(8_000);
    expect(synthesisReserveMs({ deadlineAt: 1_500, budgetMs: 1_500 })).toBe(900);
    // The measured reserve on the request wins.
    expect(synthesisReserveMs({ ...budget, postBatchReserveMs: 5_000 })).toBe(5_000);
    // No task finished yet: the 500ms minimum.
    expect(credentialBudgetAllowsStart({ now: 11_500, budget })).toBe(true);
    expect(credentialBudgetAllowsStart({ now: 11_600, budget })).toBe(false);
    // Measured 2s tasks need 3s before the reserve.
    expect(credentialBudgetAllowsStart({ now: 9_000, budget, meanTaskMs: 2_000 })).toBe(true);
    expect(credentialBudgetAllowsStart({ now: 9_100, budget, meanTaskMs: 2_000 })).toBe(false);
    // Fast tasks still keep the 500ms minimum.
    expect(credentialBudgetAllowsStart({ now: 11_500, budget, meanTaskMs: 50 })).toBe(true);
    expect(credentialBudgetAllowsStart({ now: 11_600, budget, meanTaskMs: 50 })).toBe(false);
});

test('the post-batch reserve learns from measured tails and backs off after a timeout', async () => {
    const reserve = await import('../diagnostics/post-batch-reserve');
    reserve.resetPostBatchEstimates();
    try {
        // Unmeasured: the per-tool default (13s), capped at 60% of the budget.
        expect(reserve.postBatchReserveMs('get_user_context', 45_000)).toBe(13_000);
        expect(reserve.postBatchReserveMs('get_answer_about_user', 45_000)).toBe(19_000);
        expect(reserve.postBatchReserveMs('get_user_context', 20_000)).toBe(12_000);
        expect(reserve.postBatchReserveMs('get_user_context', 10_000)).toBe(6_000);
        // Measured 4s tails pull the estimate down.
        for (let i = 0; i < 10; i++)
            reserve.recordPostBatchMs('get_user_context', 4_000, 'success');
        expect(reserve.postBatchEstimateMs('get_user_context')).toBeLessThan(4_300);
        expect(reserve.postBatchEstimateMs('get_answer_about_user')).toBe(19_000);
        // Measured: the estimate plus 25% headroom.
        expect(reserve.postBatchReserveMs('get_user_context', 45_000)).toBeLessThan(5_400);
        // A timeout 6s after the batch: the next estimate is at least 9s.
        reserve.recordPostBatchMs('get_user_context', 6_000, 'timeout');
        expect(reserve.postBatchEstimateMs('get_user_context')).toBe(9_000);
        // Failures say nothing about the tail.
        reserve.recordPostBatchMs('get_user_context', 100, 'failure');
        expect(reserve.postBatchEstimateMs('get_user_context')).toBe(9_000);
    } finally {
        reserve.resetPostBatchEstimates();
    }
});

test('the slow-read warning has a 1s floor and fires only before the timeout', () => {
    // v31 warned at 125ms (half a 250ms timeout) on every ordinary read.
    expect(credentialSlowReadMs(250)).toBeUndefined();
    expect(credentialSlowReadMs(1_000)).toBeUndefined();
    expect(credentialSlowReadMs(1_800)).toBe(1_000);
    expect(credentialSlowReadMs(3_000)).toBe(1_500);
    expect(credentialSlowReadMs(10_000)).toBe(2_000);
});

test('uriHash is a stable 12-hex keyed fingerprint, never the URI', () => {
    const uri = 'lc:cloud:credential:private-123';
    const hash = credentialUriHash(uri);
    expect(hash).toMatch(/^[0-9a-f]{12}$/);
    expect(credentialUriHash(uri)).toBe(hash);
    expect(credentialUriHash(`${uri}x`)).not.toBe(hash);
});

test('log allowlist keeps read codes, stage and hash, and drops a raw URI or bad stage', () => {
    const lines: unknown[] = [];
    const originalWarn = console.warn;
    console.warn = ((...data: unknown[]) => {
        lines.push(...data);
    }) as typeof console.warn;
    try {
        logSafeEvent('warn', 'credential_skipped', {
            credentialBatch: 'context',
            index: 0,
            failureCode: 'credential_read_timeout',
            readStage: 'fetch',
            uriHash: 'abcdef012345',
        });
        logSafeEvent('warn', 'credential_skipped', {
            credentialBatch: 'context',
            index: 1,
            failureCode: 'credential_read_failed',
            readStage: 'network' as never,
            uriHash: 'lc:cloud:credential:private-123',
        });
        logSafeEvent('warn', 'credential_read_slow', {
            readStage: 'fetch',
            uriHash: 'abcdef012345',
            durationMs: 2_001,
        });
    } finally {
        console.warn = originalWarn;
    }
    expect(lines).toEqual([
        expect.objectContaining({
            event: 'credential_skipped',
            failureCode: 'credential_read_timeout',
            readStage: 'fetch',
            uriHash: 'abcdef012345',
        }),
        expect.objectContaining({
            event: 'credential_skipped',
            failureCode: 'credential_read_failed',
        }),
        expect.objectContaining({
            event: 'credential_read_slow',
            readStage: 'fetch',
            uriHash: 'abcdef012345',
            durationMs: 2_001,
        }),
    ]);
    expect(lines[1]).not.toHaveProperty('readStage');
    expect(lines[1]).not.toHaveProperty('uriHash');
    expect(JSON.stringify(lines)).not.toContain('lc:cloud');
});
