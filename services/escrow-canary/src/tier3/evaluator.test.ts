import { describe, expect, it, vi } from 'vitest';
import { createMetrics } from '../metrics';
import {
    checkReady,
    closeRun,
    closeStep,
    initPool,
    injectOverdue,
    pause,
    resume,
    unquarantine,
} from './admin';
import { evaluate, EvaluationError, runEvaluator } from './evaluator';
import {
    createMemoryLedger,
    keys,
    LedgerCorruptError,
    parseItem,
    type Ledger,
    type LedgerItem,
} from './ledger';
import { DAY, MINUTE, HOUR, ttlSeconds } from './timing';

const NOW = Date.UTC(2026, 9, 30, 12, 0);
const config = { environment: 'staging' as const, ledgerTable: 't', poolSize: 12 as const };

const seeded = async () => {
    const ledger = createMemoryLedger();
    await initPool({ ledger, environment: 'staging', now: NOW });
    return ledger;
};
const meta = (enabledAt: number, paused = false): LedgerItem => ({
    ...keys.meta,
    type: 'meta',
    env: 'staging',
    version: 1,
    updatedAt: enabledAt,
    enabledAt,
    paused,
});
const run = (runId: string, startedAt?: number): LedgerItem => ({
    ...keys.run(runId),
    type: 'run',
    env: 'staging',
    version: 1,
    updatedAt: NOW,
    runId,
    kind: 'daily',
    label: 'hold-01',
    state: 'waiting',
    startRequestedAt: startedAt ?? NOW,
    ...(startedAt !== undefined ? { startedAt } : {}),
});
const step = (runId: string, dueAt: number, extra: Partial<LedgerItem> = {}): LedgerItem =>
    ({
        ...keys.step(runId, 'Warning'),
        type: 'step',
        env: 'staging',
        version: 1,
        updatedAt: NOW,
        runId,
        name: 'Warning',
        dueAt,
        ...extra,
    }) as LedgerItem;

describe('tier 3 deadline evaluator', () => {
    it('a ledger never made ready (no META) is not evaluable, so the heartbeat pages', async () => {
        const items = await (await seeded()).scanAll();
        expect(() => evaluate(items, NOW, 12)).toThrow(EvaluationError);
    });

    it('ready anchors StartAge itself: a runner that never ticks pages after 26 h', async () => {
        const ledger = await seeded();
        await checkReady({ ledger, environment: 'staging', now: NOW });
        // Warm-up: no start yet, no page.
        expect(evaluate(await ledger.scanAll(), NOW + HOUR, 12)).toEqual({
            overdue: 0,
            poolAvailable: 12,
            startAgeMinutes: 60,
            paused: false,
        });
        // The runner failed every tick before writing anything (bad config).
        expect(
            evaluate(await ledger.scanAll(), NOW + 27 * HOUR, 12).startAgeMinutes
        ).toBeGreaterThan(1560);
    });

    it('ready re-anchors META only while no run was ever recorded', async () => {
        const ledger = await seeded();
        const context = { ledger, environment: 'staging' as const, now: NOW };
        await checkReady(context);
        await checkReady({ ...context, now: NOW + 3 * DAY });
        expect(evaluate(await ledger.scanAll(), NOW + 3 * DAY, 12).startAgeMinutes).toBe(0);
        await ledger.write([{ kind: 'create', item: run('a') }]);
        await checkReady({ ...context, now: NOW + 4 * DAY });
        expect(evaluate(await ledger.scanAll(), NOW + 4 * DAY, 12).startAgeMinutes).toBe(24 * 60);
    });

    it('ready refuses an incomplete pool and writes nothing', async () => {
        const ledger = createMemoryLedger();
        await expect(checkReady({ ledger, environment: 'staging', now: NOW })).rejects.toThrow(
            EvaluationError
        );
        expect(await ledger.get(keys.meta)).toBeUndefined();
    });

    it('counts only unobserved, outcome-less steps that are past due', async () => {
        const ledger = await seeded();
        await ledger.write([
            { kind: 'create', item: meta(NOW - HOUR) },
            { kind: 'create', item: run('a', NOW - HOUR) },
            { kind: 'create', item: step('a', NOW - MINUTE) },
        ]);
        expect(evaluate(await ledger.scanAll(), NOW, 12).overdue).toBe(1);
        expect(evaluate(await ledger.scanAll(), NOW - 2 * MINUTE, 12).overdue).toBe(0);
        const items = await ledger.scanAll();
        const due = items.find(item => item.type === 'step')!;
        for (const variant of [{ observedAt: NOW }, { outcome: '0' }, { outcome: 'abandoned' }])
            expect(
                evaluate(
                    items.map(item =>
                        item === due ? ({ ...item, ...variant } as LedgerItem) : item
                    ),
                    NOW,
                    12
                ).overdue
            ).toBe(0);
    });

    it('measures StartAge from the newest successful start or the enablement anchor', async () => {
        const ledger = await seeded();
        await ledger.write([
            { kind: 'create', item: meta(NOW - 30 * HOUR) },
            { kind: 'create', item: run('a', NOW - 3 * HOUR) },
            { kind: 'create', item: run('b') }, // never started (no startedAt)
        ]);
        expect(evaluate(await ledger.scanAll(), NOW, 12).startAgeMinutes).toBe(180);
    });

    it('counts cooling accounts only once available', async () => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW) }]);
        const [pool] = (await ledger.scanAll()).filter(item => item.type === 'pool');
        await ledger.write([
            {
                kind: 'replace',
                expectedVersion: 1,
                item: {
                    ...pool,
                    version: 2,
                    state: 'cooling',
                    availableAt: NOW + MINUTE,
                } as LedgerItem,
            },
        ]);
        expect(evaluate(await ledger.scanAll(), NOW, 12).poolAvailable).toBe(11);
        expect(evaluate(await ledger.scanAll(), NOW + MINUTE, 12).poolAvailable).toBe(12);
    });

    it.each([
        ['pool count mismatch', (items: LedgerItem[]) => items.slice(1)],
        [
            'duplicate META',
            (items: LedgerItem[]) => [...items, { ...meta(NOW), sk: 'OTHER' } as LedgerItem],
        ],
        ['orphan open step', (items: LedgerItem[]) => [...items, step('missing-run', NOW)]],
    ])('throws on %s (scenario e)', async (_name, corrupt) => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW) }]);
        const items = corrupt(await ledger.scanAll());
        expect(() => evaluate(items, NOW, 12)).toThrow(EvaluationError);
    });

    it('TTL: a closed step that outlives its run header is ignored, not a ledger error', async () => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW - 40 * DAY) }]);
        const expiresAt = ttlSeconds(NOW - 36 * DAY);
        const items = [
            ...(await ledger.scanAll()),
            step('expired', NOW - 39 * DAY, {
                observedAt: NOW - 39 * DAY,
                outcome: '1',
                expiresAt,
            }),
            step('expired-2', NOW - 39 * DAY, { outcome: 'abandoned', expiresAt }),
        ];
        expect(evaluate(items, NOW, 12).overdue).toBe(0);
    });

    it('rejects malformed or unknown items at parse time', () => {
        expect(() => parseItem({ ...meta(NOW), type: 'surprise' })).toThrow(LedgerCorruptError);
        expect(() => parseItem({ ...meta(NOW), enabledAt: 'yesterday' })).toThrow(
            LedgerCorruptError
        );
        expect(() => parseItem({ ...meta(NOW), extra: 1 })).toThrow(LedgerCorruptError);
    });

    it('emits gauges then the heartbeat LAST', async () => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW) }]);
        const lines: string[] = [];
        await runEvaluator({ time: new Date(NOW).toISOString() }, config, {
            ledger,
            emit: createMetrics('staging', 3, line => lines.push(line)),
            now: () => NOW,
        });
        const names = lines.map(line => JSON.parse(line)._aws.CloudWatchMetrics[0].Metrics[0].Name);
        expect(names).toEqual([
            'Tier3.Overdue',
            'Tier3.PoolAvailable',
            'Tier3.StartAgeMinutes',
            'Tier3.Paused',
            'Tier3.EvaluatorHeartbeat',
        ]);
        for (const line of lines)
            expect(JSON.parse(line)._aws.CloudWatchMetrics[0].Dimensions).toContainEqual([
                'Environment',
                'Tier',
            ]);
    });

    it.each([
        ['unreadable ledger', { scanAll: async () => Promise.reject(new Error('AccessDenied')) }],
        ['malformed item', { scanAll: async () => [parseItem({ pk: 'x' })] }],
    ])(
        'scenario (e) %s: emits nothing at all, so the heartbeat alarm pages',
        async (_name, broken) => {
            const emit = vi.fn();
            await expect(
                runEvaluator({ time: new Date(NOW).toISOString() }, config, {
                    ledger: broken as unknown as Ledger,
                    emit,
                    now: () => NOW,
                })
            ).rejects.toThrow();
            expect(emit).not.toHaveBeenCalled();
        }
    );

    it('rejects a stale event and emits nothing', async () => {
        const emit = vi.fn();
        await expect(
            runEvaluator({ time: new Date(NOW - 10 * MINUTE).toISOString() }, config, {
                ledger: await seeded(),
                emit,
                now: () => NOW,
            })
        ).rejects.toThrow(EvaluationError);
        expect(emit).not.toHaveBeenCalled();
    });

    it('paused: Overdue and StartAge are 0; resume re-anchors and gives open steps an hour', async () => {
        const ledger = await seeded();
        await ledger.write([
            { kind: 'create', item: meta(NOW - 40 * HOUR) },
            { kind: 'create', item: run('a', NOW - 40 * HOUR) },
            { kind: 'create', item: step('a', NOW - MINUTE) },
        ]);
        const context = { ledger, environment: 'staging' as const, now: NOW };
        await pause(context);
        expect(evaluate(await ledger.scanAll(), NOW, 12)).toMatchObject({
            overdue: 0,
            startAgeMinutes: 0,
            paused: true,
        });
        await resume({ ...context, now: NOW + HOUR });
        const resumed = evaluate(await ledger.scanAll(), NOW + HOUR + 59 * MINUTE, 12);
        expect(resumed).toMatchObject({ overdue: 0, startAgeMinutes: 59, paused: false });
        expect(evaluate(await ledger.scanAll(), NOW + 2 * HOUR, 12).overdue).toBe(1);
    });

    it('staging drill: inject-overdue pages on the next evaluation; close-step clears it', async () => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW - HOUR) }]);
        const context = { ledger, environment: 'staging' as const, now: NOW };
        const runId = await injectOverdue(context);
        expect(evaluate(await ledger.scanAll(), NOW, 12).overdue).toBe(1);
        await closeStep(context, runId, 'Warning');
        expect(evaluate(await ledger.scanAll(), NOW, 12).overdue).toBe(0);
    });

    it('inject-overdue refuses production in code, whatever the ledger says', async () => {
        const ledger = await seeded();
        await expect(
            injectOverdue({ ledger, environment: 'production', now: NOW })
        ).rejects.toThrow('staging-only');
        const production = createMemoryLedger();
        await initPool({ ledger: production, environment: 'production', now: NOW });
        await expect(
            injectOverdue({ ledger: production, environment: 'staging', now: NOW })
        ).rejects.toThrow('staging-only');
    });

    it('close-run frees a stuck run: open steps operator_closed, account orphaned or quarantined', async () => {
        const ledger = await seeded();
        await ledger.write([{ kind: 'create', item: meta(NOW - DAY) }]);
        const pool = (await ledger.get(keys.pool('hold-01')))!;
        await ledger.write([
            { kind: 'create', item: run('stuck', NOW - 8 * DAY) },
            { kind: 'create', item: step('stuck', NOW - HOUR) },
            {
                kind: 'replace',
                expectedVersion: 1,
                item: { ...pool, version: 2, state: 'busy', runId: 'stuck' } as LedgerItem,
            },
        ]);
        const context = { ledger, environment: 'staging' as const, now: NOW };
        expect(evaluate(await ledger.scanAll(), NOW, 12).overdue).toBe(1);
        await expect(closeRun(context, 'missing', 'orphaned')).rejects.toThrow('not open');
        await closeRun(context, 'stuck', 'quarantined');
        const items = await ledger.scanAll();
        expect(evaluate(items, NOW, 12)).toMatchObject({ overdue: 0, poolAvailable: 11 });
        expect(items.find(item => item.type === 'run')).toMatchObject({
            state: 'closed',
            closeReason: 'operator_closed',
        });
        expect(items.find(item => item.type === 'step')).toMatchObject({
            outcome: 'operator_closed',
        });
        expect(await ledger.get(keys.pool('hold-01'))).toMatchObject({
            state: 'quarantined',
            quarantineReason: 'operator_closed',
        });
        expect(
            ((await ledger.get(keys.pool('hold-01'))) as { runId?: string }).runId
        ).toBeUndefined();
        await expect(closeRun(context, 'stuck', 'orphaned')).rejects.toThrow('not open');
        await unquarantine(context, 'hold-01');
        expect(evaluate(await ledger.scanAll(), NOW, 12).poolAvailable).toBe(12);
    });
});
