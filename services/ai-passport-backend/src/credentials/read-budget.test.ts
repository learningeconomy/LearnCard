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

test('the batch stops starting credentials when only the reserve is left', () => {
    const budget = { deadlineAt: 20_000, budgetMs: 20_000 };
    expect(synthesisReserveMs(20_000)).toBe(8_000);
    expect(synthesisReserveMs(1_500)).toBe(600);
    expect(credentialBudgetAllowsStart({ now: 11_000, budget })).toBe(true);
    expect(credentialBudgetAllowsStart({ now: 11_600, budget })).toBe(false);
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
