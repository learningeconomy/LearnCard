import { afterEach, expect, test } from 'bun:test';

process.env.AI_PRIVACY_KEY ||= Buffer.alloc(32, 7).toString('base64');

const {
    CREDENTIAL_READ_FLOOR_MS,
    credentialReadTimeoutMs,
    credentialSlowReadMs,
    credentialUriHash,
} = await import('./read-budget');
const { logSafeEvent } = await import('../logging');

afterEach(() => {
    delete process.env.CREDENTIAL_READ_TIMEOUT_MS;
});

test('without a request deadline a read keeps LEARNCARD_CALL_TIMEOUT_MS', () => {
    expect(credentialReadTimeoutMs({ pending: 10, concurrency: 4 })).toBeUndefined();
});

test('a read gets the cap or its share of the remaining budget per wave left', () => {
    // 20s budget, 40 URIs at concurrency 4: 10 waves share half of 20s.
    expect(
        credentialReadTimeoutMs({ pending: 40, concurrency: 4, now: 0, deadlineAt: 20_000 })
    ).toBe(1_000);
    // One wave left: capped at 3s, never the whole budget.
    expect(
        credentialReadTimeoutMs({ pending: 2, concurrency: 4, now: 0, deadlineAt: 20_000 })
    ).toBe(3_000);
    process.env.CREDENTIAL_READ_TIMEOUT_MS = '1500';
    expect(
        credentialReadTimeoutMs({ pending: 2, concurrency: 4, now: 0, deadlineAt: 20_000 })
    ).toBe(1_500);
    // A spent budget still gets the floor, not zero or negative.
    expect(
        credentialReadTimeoutMs({ pending: 8, concurrency: 4, now: 25_000, deadlineAt: 20_000 })
    ).toBe(CREDENTIAL_READ_FLOOR_MS);
});

test('the slow-read warning fires before the read times out', () => {
    expect(credentialSlowReadMs(3_000)).toBe(1_500);
    expect(credentialSlowReadMs(10_000)).toBe(2_000);
    expect(credentialSlowReadMs(250)).toBe(125);
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
