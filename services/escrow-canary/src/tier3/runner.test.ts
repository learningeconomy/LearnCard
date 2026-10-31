import { describe, expect, it } from 'vitest';
import { EscrowRequestError } from '@learncard/sss-key-manager';
import { createMetrics } from '../metrics';
import type { AccountSecret } from '../secrets';
import { initPool, pause } from './admin';
import { runEvaluator } from './evaluator';
import {
    createMemoryLedger,
    keys,
    type Ledger,
    type LedgerWrite,
    type PoolItem,
    type RunItem,
} from './ledger';
import type { RunnerConfig } from './config';
import { runTier3 } from './runner';
import { baseConfig, codeEmail, emailFor, runnerConfig, World } from './test-fakes';
import { DAY, HOUR, MINUTE, warningDeadlineMs, warningSendsAfterMs } from './timing';

// 2026-10-27 is a Tuesday; 2026-11-02 a Monday.
const TUESDAY = Date.UTC(2026, 9, 27, 14, 0);
const MONDAY = Date.UTC(2026, 10, 2, 14, 0);
const TICK = 15 * MINUTE;

type Line = Record<string, unknown>;

const harness = async (
    start: number,
    configure?: (world: World) => void,
    config: RunnerConfig = runnerConfig
) => {
    const world = new World(start);
    world.options.holdDurationMs = config.holdDurationMs;
    configure?.(world);
    const memory = createMemoryLedger();
    let crash: ((write: LedgerWrite) => boolean) | undefined;
    const ledger: Ledger & { items: typeof memory.items } = {
        ...memory,
        write: async writes => {
            if (crash && writes.some(write => crash!(write))) {
                crash = undefined;
                throw new Error('simulated crash');
            }
            await memory.write(writes);
        },
    };
    await initPool({ ledger, environment: 'staging', now: start });
    const lines: string[] = [];
    const emit = createMetrics('staging', 3, line => lines.push(line));
    const deps = {
        ledger,
        inbox: world.store,
        secrets: world.secretStore,
        sdk: world.sdk,
        emit,
        refresh: world.refresh,
        now: () => world.now,
        sleep: async (ms: number) => world.advance(ms),
    };
    const tick = () =>
        runTier3({ time: new Date(world.now).toISOString() }, baseConfig, config, deps);
    const evaluations: { at: number; overdue: number; startAge: number; pool: number }[] = [];
    const evaluateNow = async () => {
        const result = await runEvaluator(
            { time: new Date(world.now).toISOString() },
            { environment: 'staging', ledgerTable: 't', poolSize: 12 },
            { ledger, emit, now: () => world.now }
        );
        evaluations.push({
            at: world.now,
            overdue: result.overdue,
            startAge: result.startAgeMinutes,
            pool: result.poolAvailable,
        });
    };
    /** Ticks every 15 minutes (runner then evaluator) for `ms`. */
    const run = async (ms: number, options: { evaluate?: boolean } = {}) => {
        const end = world.now + ms;
        while (world.now < end) {
            const t0 = world.now;
            await tick().catch(() => undefined);
            if (options.evaluate !== false) await evaluateNow();
            world.advance(Math.max(0, t0 + TICK - world.now));
        }
    };
    const metrics = (): Line[] => lines.map(line => JSON.parse(line));
    const values = (name: string, filter: Line = {}): unknown[] =>
        metrics()
            .filter(line => name in line && Object.entries(filter).every(([k, v]) => line[k] === v))
            .map(line => line[name]);
    const pool = async (label: string) => (await ledger.get(keys.pool(label))) as PoolItem;
    const runs = () => ledger.items().filter((item): item is RunItem => item.type === 'run');
    const count = (call: string) => world.calls.filter(c => c === call).length;
    return {
        world,
        ledger,
        lines,
        tick,
        run,
        evaluateNow,
        evaluations,
        values,
        pool,
        runs,
        count,
        crashOn: (predicate: (write: LedgerWrite) => boolean) => {
            crash = predicate;
        },
    };
};

const leakFree = (lines: string[], world: World) => {
    const text = lines.join('\n');
    expect(text).not.toMatch(
        /resume-secret|ephemeral-secret|token-hold|refresh-hold|did:key|canary-staging\+|hold-id-/
    );
    for (const hold of world.holds) expect(text).not.toContain(hold.code);
};

describe('tier 3 daily run (fake clock)', () => {
    it('starts, confirms, warns, releases at the effective deadline and re-enrols without false pages', async () => {
        const h = await harness(TUESDAY);
        await h.run(9 * DAY);
        expect(h.values('Tier3.Started').length).toBeGreaterThanOrEqual(9);
        expect(h.values('Tier3.Started')).not.toContain(0);
        expect(h.values('Tier3.Confirmed')).not.toContain(0);
        expect(h.values('Tier3.Warned', { Kind: 'daily' })).toEqual([1, 1, 1]);
        expect(h.values('Tier3.Released')).toEqual([1, 1]);
        expect(h.values('Tier3.Reenrolled')).toEqual([1, 1]);
        expect(h.values('Tier3.Cancelled')).toEqual([1]); // Monday's weekly run
        // Scenario (a)+(b): warm-up and cancel gap never page; heartbeat every evaluation.
        expect(h.evaluations.every(e => e.overdue === 0)).toBe(true);
        expect(h.evaluations.every(e => e.startAge < 1560)).toBe(true);
        expect(h.values('Tier3.EvaluatorHeartbeat')).toHaveLength(h.evaluations.length);
        expect(Math.min(...h.evaluations.map(e => e.pool))).toBeGreaterThanOrEqual(2);
        // The first hold released only after the warning-recomputed deadline.
        const first = h.world.holds[0];
        expect(first.status).toBe('completed');
        const released = h.runs().find(run => run.runId.startsWith('daily-2026-10-27'))!;
        expect(released.state).toBe('closed');
        expect(released.closeReason).toBe('reenrolled');
        expect(released.releasedAt!).toBeGreaterThanOrEqual(first.warnedAt! + DAY + MINUTE);
        // Secret: rotated device state persisted; spent hold removed.
        const secret = h.world.secretOf(released.label);
        expect(secret.hold).toBeUndefined();
        expect(secret.lastReleasedRunId).toBe(released.runId);
        expect(Object.values(secret.deviceState.shares)[0]).toMatch(/^rotated-share-/);
        expect((await h.pool(released.label)).state).toBe('idle');
        // One early-refusal attempt and one release per daily run that reached release.
        // 3 early-refusal checks + 2 releases + the cancel run's completion check.
        expect(h.count('release')).toBe(3 + 2 + 1);
        leakFree(h.lines, h.world);
    });

    it.each([
        ['staging 10-minute hold', 10 * MINUTE],
        ['2-day hold', 2 * DAY],
    ])(
        'derives warning timing from the hold duration (%s): warns, releases, no false pages',
        async (_name, holdDurationMs) => {
            const h = await harness(TUESDAY, undefined, { ...runnerConfig, holdDurationMs });
            await h.run(holdDurationMs + 2 * DAY);
            const first = h.runs().find(run => run.runId.startsWith('daily-2026-10-27'))!;
            const warning = h.ledger
                .items()
                .find(
                    item =>
                        item.type === 'step' &&
                        item.runId === first.runId &&
                        item.name === 'Warning'
                ) as { dueAt: number; observedAt?: number } | undefined;
            expect(warning?.dueAt).toBe(first.confirmedAt! + warningDeadlineMs(holdDurationMs));
            expect(warning?.observedAt).toBeDefined();
            expect(warning!.observedAt!).toBeGreaterThanOrEqual(
                first.confirmedAt! + warningSendsAfterMs(holdDurationMs)
            );
            expect(h.values('Tier3.Warned', { Account: first.label })).toContain(1);
            expect(h.values('Tier3.Released', { Account: first.label })).toContain(1);
            expect(h.evaluations.every(e => e.overdue === 0)).toBe(true);
        }
    );

    it('scenario (c): a suppressed warning is overdue on the first evaluation after confirm + 6d + 2h', async () => {
        const h = await harness(TUESDAY, world => {
            world.options.suppressWarning = true;
        });
        await h.run(7 * DAY);
        const confirmedAt = h
            .runs()
            .find(run => run.runId.startsWith('daily-2026-10-27'))!.confirmedAt!;
        const due = confirmedAt + 6 * DAY + 2 * HOUR;
        const firstOverdue = h.evaluations.find(e => e.overdue > 0)!;
        expect(firstOverdue.at).toBeGreaterThanOrEqual(due);
        expect(firstOverdue.at).toBeLessThan(due + TICK + 7 * MINUTE);
        expect(h.evaluations.filter(e => e.at < due).every(e => e.overdue === 0)).toBe(true);
    });

    it('a warning that never arrives: Overdue pages first, a day later the run is orphaned and its hold cancelled', async () => {
        const h = await harness(TUESDAY, world => {
            world.options.suppressWarning = true;
        });
        await h.run(8 * DAY + 6 * HOUR);
        const first = h.runs().find(run => run.runId.startsWith('daily-2026-10-27'))!;
        const due = first.confirmedAt! + 6 * DAY + 2 * HOUR;
        expect(first.state).toBe('closed');
        expect(first.closeReason).toBe('warning_missing');
        expect(first.closedAt!).toBeGreaterThanOrEqual(due + DAY);
        expect(first.closedAt!).toBeLessThan(due + DAY + TICK);
        // The Overdue page fired before the run was given up.
        expect(h.evaluations.find(e => e.overdue > 0)!.at).toBeLessThan(first.closedAt!);
        expect(
            h.lines
                .map(line => JSON.parse(line))
                .find(line => line['Tier3.Warned'] === 0 && line.Account === first.label)
        ).toMatchObject({ Reason: 'warning_missing' });
        // The closed Warning step stops counting as overdue once failed.
        const step = (await h.ledger.get(keys.step(first.runId, 'Warning'))) as {
            outcome?: string;
            expiresAt?: number;
        };
        expect(step.outcome).toBe('0');
        // TTL: the run header outlives its steps by a day.
        expect(first.expiresAt).toBe(step.expiresAt! + DAY / 1000);
        // Orphan cleanup cancelled the pending hold through the user path.
        const hold = h.world.holds.find(candidate => candidate.label === first.label)!;
        expect(hold.status).toBe('cancelled');
        expect(h.world.secretOf(first.label).hold).toBeUndefined();
        expect(['cooling', 'busy']).toContain((await h.pool(first.label)).state);
    });

    it('scenario (d): the runner alone never emits a heartbeat', async () => {
        const h = await harness(TUESDAY);
        await h.run(2 * DAY, { evaluate: false });
        expect(h.values('Tier3.Started').length).toBeGreaterThan(0);
        expect(h.values('Tier3.EvaluatorHeartbeat')).toHaveLength(0);
    });

    it('waits for the recomputed deadline when lca-api saves it after the warning email', async () => {
        const h = await harness(TUESDAY, world => {
            world.options.deadlineWriteLagMs = HOUR;
        });
        await h.run(8 * DAY + 4 * HOUR);
        expect(h.values('Tier3.Warned', { Kind: 'daily' })[0]).toBe(1);
        expect(h.values('Tier3.Released')[0]).toBe(1);
    });

    it('fails deadline_mismatch only after the grace when the deadline never moves', async () => {
        const h = await harness(TUESDAY, world => {
            world.options.deadlineWriteLagMs = 5 * HOUR;
        });
        await h.run(7 * DAY);
        const failed = h.lines
            .filter(line => line.includes('"Tier3.Warned"'))
            .map(line => JSON.parse(line));
        expect(failed[0]).toMatchObject({ 'Tier3.Warned': 0, Reason: 'deadline_mismatch' });
        const run = h.runs().find(r => r.runId.startsWith('daily-2026-10-27'))!;
        expect(run.closedAt! - run.warningObservedAt!).toBeGreaterThanOrEqual(2 * HOUR - TICK);
        expect((await h.pool(run.label)).state).toBe('orphaned');
    });

    it('flags an early release as a Warned failure and keeps the account usable', async () => {
        const h = await harness(TUESDAY, world => {
            world.options.earlyRelease = true;
        });
        await h.run(7 * DAY);
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Warned"'))!)).toMatchObject({
            'Tier3.Warned': 0,
            Reason: 'early_release',
        });
        const run = h.runs().find(r => r.runId.startsWith('daily-2026-10-27'))!;
        expect(run.closeReason).toBe('early_release');
        expect(h.world.secretOf(run.label).lastReleasedRunId).toBe(run.runId);
        expect((await h.pool(run.label)).state).toBe('idle');
    });

    it('retries a waiting-period refusal and an enclave Unavailable before the Released deadline', async () => {
        const h = await harness(TUESDAY);
        await h.run(6 * DAY + 3 * HOUR);
        expect(h.values('Tier3.Warned', { Kind: 'daily' })).toEqual([1]);
        const hold = h.world.holds[0];
        // Server-side deadline moves 20 minutes later than the runner recorded.
        hold.releaseAfter = hold.warnedAt! + DAY + 21 * MINUTE;
        h.world.options.unavailable = 1;
        await h.run(DAY + 2 * HOUR);
        expect(h.values('Tier3.Released')).toEqual([1]);
        expect(h.values('Step.Failure', { Step: 'release' }).length).toBeGreaterThanOrEqual(2);
        expect(hold.status).toBe('completed');
    });

    it.each([
        [
            'release error',
            (w: World) => (w.options.throwOnRelease = new Error('private')),
            'Tier3.Released',
            'unexpected',
        ],
        [
            'DID mismatch',
            (w: World) => (w.options.wrongDid = true),
            'Tier3.Released',
            'did_mismatch',
        ],
        [
            'not re-enrolled',
            (w: World) => (w.options.reenrol = false),
            'Tier3.Reenrolled',
            'not_enrolled',
        ],
        [
            'authority inactive',
            (w: World) => (w.options.authorityOk = false),
            'Tier3.Reenrolled',
            'not_enrolled',
        ],
    ])('quarantines on %s', async (_name, breakIt, metric, reason) => {
        const h = await harness(TUESDAY);
        await h.run(7 * DAY);
        breakIt(h.world);
        await h.run(DAY + 2 * HOUR);
        const line = JSON.parse(h.lines.find(l => l.includes(`"${metric}":0`))!);
        expect(line).toMatchObject({ Reason: reason });
        const run = h.runs().find(r => r.runId.startsWith('daily-2026-10-27'))!;
        const pool = await h.pool(run.label);
        expect(pool.state).toBe('quarantined');
        leakFree(h.lines, h.world);
    });
});

describe('tier 3 weekly cancel', () => {
    it('cancels in the app, proves completion is refused as cancelled, then cools the account', async () => {
        const h = await harness(MONDAY);
        await h.run(3 * HOUR);
        expect(h.values('Tier3.Cancelled')).toEqual([1]);
        const run = h.runs().find(r => r.kind === 'cancel')!;
        expect(run.closeReason).toBe('cancelled');
        const pool = await h.pool(run.label);
        expect(pool.state).toBe('cooling');
        expect(pool.availableAt).toBe(run.closedAt! + 48 * HOUR);
        expect(h.world.secretOf(run.label).hold).toBeUndefined();
        // No Warning step on a cancel run; the cancel step was observed.
        const steps = h.ledger
            .items()
            .filter(item => item.pk === `RUN#${run.runId}` && item.type === 'step');
        expect(steps.map(step => (step.type === 'step' ? step.name : '')).sort()).toEqual([
            'Cancelled',
            'CodeEmail',
            'Confirmed',
        ]);
    });

    it('never runs two code-sending actions in one tick', async () => {
        const h = await harness(MONDAY + 2 * HOUR); // first tick 16:00: both slots unclaimed
        await h.tick();
        expect(h.count('start')).toBe(1);
        expect(h.runs().map(run => run.kind)).toEqual(['daily']);
    });

    it.each([
        [
            'cancel reports nothing cancelled',
            (w: World) => (w.options.cancelIgnored = true),
            'invalid_hold',
        ],
        [
            'completion refused for another reason',
            (w: World) => (w.options.throwOnRelease = new EscrowRequestError(412)),
            'cancel_not_refused',
        ],
    ])('fails Cancelled when %s', async (_name, breakIt, reason) => {
        const h = await harness(MONDAY);
        await h.run(2 * HOUR);
        breakIt(h.world);
        await h.run(HOUR);
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Cancelled"'))!)).toMatchObject({
            'Tier3.Cancelled': 0,
            Reason: reason,
        });
    });
});

describe('tier 3 start, code and orphan handling', () => {
    it.each([
        [
            'start error',
            (w: World) => (w.options.startError = new EscrowRequestError(503)),
            'unavailable',
        ],
        [
            'existing hold reported',
            (w: World) => (w.options.reportExistingHold = true),
            'existing_hold',
        ],
        ['code not sent', (w: World) => (w.options.codeSent = false), 'code_not_sent'],
    ])('%s: Started=0 and the account is orphaned', async (_name, breakIt, reason) => {
        const h = await harness(TUESDAY + HOUR, breakIt);
        await h.tick();
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Started"'))!)).toMatchObject({
            'Tier3.Started': 0,
            Reason: reason,
        });
        const run = h.runs()[0];
        expect((await h.pool(run.label)).state).toBe('orphaned');
    });

    it.each([
        ["the other environment's local part", 'canary+1@inbox.example.com'],
        ["another account's +n", 'canary-staging+2@inbox.example.com'],
    ])(
        'refuses a hold secret registered with %s before any escrow call',
        async (_name, recoveryEmail) => {
            const h = await harness(TUESDAY + HOUR, world => {
                world.secretOf('hold-01').recoveryEmail = recoveryEmail;
            });
            await h.tick();
            expect(h.count('start')).toBe(0);
            expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Started"'))!)).toMatchObject({
                'Tier3.Started': 0,
                Reason: 'config',
            });
            const run = h.runs()[0];
            expect(run.label).toBe('hold-01');
            expect(run.closeReason).toBe('start_not_called');
            expect((await h.pool('hold-01')).state).toBe('idle');
        }
    );

    it('cleans an orphan once after 24h through the user cancel path', async () => {
        const h = await harness(TUESDAY + HOUR, world => (world.options.codeSent = false));
        await h.tick();
        const label = h.runs()[0].label;
        expect(h.world.secretOf(label).hold).toBeDefined(); // resume material kept
        h.world.options.codeSent = true;
        await h.run(DAY + HOUR);
        expect(h.count('cancel')).toBe(1);
        expect(h.world.secretOf(label).hold).toBeUndefined();
        const pool = await h.pool(label);
        expect(pool.state).toBe('cooling');
    });

    it('quarantines after a failed cleanup and never retries it', async () => {
        const h = await harness(
            TUESDAY + HOUR,
            world => (world.options.startError = new Error('x'))
        );
        await h.tick();
        const label = h.runs()[0].label;
        h.world.options.startError = undefined;
        h.world.options.refreshRejected.add(label);
        await h.run(3 * DAY);
        const pool = await h.pool(label);
        expect(pool.state).toBe('quarantined');
        expect(pool.quarantineReason).toBe('cleanup_failed');
        expect(h.values('Runner.AuthFailure')).toContain(1);
    });

    it('a missing code email expires: Confirmed=0 codeExpired, CodeEmail failed', async () => {
        const h = await harness(TUESDAY + HOUR, world => (world.options.suppressCodeEmail = true));
        await h.run(HOUR);
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Confirmed"'))!)).toMatchObject({
            'Tier3.Confirmed': 0,
            Reason: 'codeExpired',
        });
        expect(h.count('confirm')).toBe(0);
        expect(h.evaluations.some(e => e.overdue > 0)).toBe(true); // CodeEmail/Confirmed were overdue before expiry
    });

    it('submits a parsed code once and never resubmits after a mismatch', async () => {
        const h = await harness(TUESDAY + HOUR, world => (world.options.emailDelayMs = 40_000));
        // A newer, trusted email with the wrong code arrives first in newest-first order.
        h.world.deliver('hold-01', h.world.now + 25_000, codeEmail(emailFor(0), '00000000'));
        await h.run(HOUR);
        expect(h.count('confirm')).toBe(1);
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Confirmed"'))!)).toMatchObject({
            Reason: 'codeMismatch',
        });
    });

    it('ignores untrusted mail and reports it as a diagnostic', async () => {
        const h = await harness(TUESDAY + HOUR, world => (world.options.suppressCodeEmail = true));
        h.world.deliver('hold-01', h.world.now + 10_000, {
            ...codeEmail(emailFor(0), '12345678'),
            authResults:
                'amazonses.com; spf=pass; dkim=fail header.i=@vault.notify.example.com; dmarc=fail',
        });
        await h.tick();
        expect(h.count('confirm')).toBe(0);
        expect(h.values('Step.Failure', { Reason: 'email_untrusted' }).length).toBeGreaterThan(0);
    });

    it('records the email latency from the code email object time', async () => {
        const h = await harness(TUESDAY + HOUR);
        await h.tick();
        expect(h.values('Tier3.EmailLatency', { Kind: 'code' })).toEqual([20_000]);
    });

    it('persists a rotated refresh token before any other I/O', async () => {
        const h = await harness(TUESDAY + HOUR, world => (world.options.rotateRefresh = true));
        await h.tick();
        const [first, second] = h.world.secretWrites;
        expect(first.refreshToken).toMatch(/-r\d+$/);
        expect(first.hold).toBeUndefined();
        expect(second.hold).toBeDefined();
        expect(second.refreshToken).toBe(first.refreshToken);
    });

    it('selects the least recently returned idle account and skips cooling ones', async () => {
        const h = await harness(TUESDAY + HOUR);
        const pool = (await h.pool('hold-01')) as PoolItem;
        await h.ledger.write([
            {
                kind: 'replace',
                expectedVersion: pool.version,
                item: {
                    ...pool,
                    version: pool.version + 1,
                    state: 'cooling',
                    availableAt: h.world.now + HOUR,
                },
            },
        ]);
        await h.tick();
        expect(h.runs()[0].label).toBe('hold-02');
    });

    it('an exhausted pool starts nothing and emits no Started=0', async () => {
        const h = await harness(TUESDAY + HOUR);
        for (const item of h.ledger.items())
            if (item.type === 'pool')
                await h.ledger.write([
                    {
                        kind: 'replace',
                        expectedVersion: item.version,
                        item: {
                            ...item,
                            version: item.version + 1,
                            state: 'quarantined',
                            quarantineReason: 'test',
                        },
                    },
                ]);
        await h.tick();
        expect(h.count('start')).toBe(0);
        expect(h.values('Tier3.Started')).toHaveLength(0);
    });

    it('does nothing while paused', async () => {
        const h = await harness(TUESDAY + HOUR);
        await h.tick();
        await pause({ ledger: h.ledger, environment: 'staging', now: h.world.now });
        const calls = h.world.calls.length;
        const writes = h.world.secretWrites.length;
        h.world.advance(DAY);
        await h.tick();
        expect(h.world.calls.length).toBe(calls);
        expect(h.world.secretWrites.length).toBe(writes);
        await h.evaluateNow();
        expect(h.values('Tier3.Paused').at(-1)).toBe(1);
        expect(h.evaluations.at(-1)).toMatchObject({ overdue: 0, startAge: 0 });
    });

    it('rejects a stale event without touching anything', async () => {
        const h = await harness(TUESDAY + HOUR);
        await expect(
            runTier3(
                { time: new Date(h.world.now - 10 * MINUTE).toISOString() },
                baseConfig,
                runnerConfig,
                {
                    ledger: h.ledger,
                    inbox: h.world.store,
                    secrets: h.world.secretStore,
                    sdk: h.world.sdk,
                    emit: () => undefined,
                    now: () => h.world.now,
                }
            )
        ).rejects.toMatchObject({ reason: 'stale_event' });
        expect(h.world.calls).toHaveLength(0);
    });
});

describe('tier 3 crash safety and duplicates', () => {
    it('concurrent ticks claim the daily slot once', async () => {
        const h = await harness(TUESDAY + HOUR);
        await Promise.all([h.tick(), h.tick()]);
        expect(h.count('start')).toBe(1);
        expect(h.runs()).toHaveLength(1);
    });

    it('a crash before the start call closes the run without orphaning the account', async () => {
        const h = await harness(TUESDAY + HOUR);
        h.crashOn(write => write.item.type === 'run' && write.item.startCallAt !== undefined);
        await expect(h.tick()).rejects.toThrow();
        h.world.advance(TICK);
        await h.tick();
        const run = h.runs()[0];
        expect(run.closeReason).toBe('start_not_called');
        expect((await h.pool(run.label)).state).toBe('idle');
        expect(h.count('start')).toBe(0);
    });

    it('a crash after the hold was persisted resumes the run, it does not orphan it', async () => {
        const h = await harness(TUESDAY + HOUR);
        h.crashOn(write => write.item.type === 'run' && write.item.state === 'awaiting_code');
        await expect(h.tick()).rejects.toThrow();
        h.world.advance(TICK);
        await h.tick();
        expect(h.values('Tier3.Started', { Outcome: 'duplicate' })).toEqual([1]);
        expect(h.values('Tier3.Confirmed')).toEqual([1]);
        expect(h.count('start')).toBe(1);
    });

    it('a lost start response (call made, nothing persisted) is start_lost and orphaned', async () => {
        const h = await harness(TUESDAY + HOUR);
        const original = h.world.secretStore.write;
        h.world.secretStore.write = async (arn: string, value: AccountSecret) => {
            if (value.hold) throw new Error('crash');
            return original(arn, value);
        };
        await expect(h.tick()).rejects.toThrow();
        h.world.secretStore.write = original;
        h.world.advance(TICK);
        await h.tick();
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Started":0'))!)).toMatchObject({
            Reason: 'start_lost',
        });
        expect((await h.pool('hold-01')).state).toBe('orphaned');
    });

    it('a crash after confirm resubmits the same code once (idempotent) and never twice', async () => {
        const h = await harness(TUESDAY + HOUR);
        h.crashOn(write => write.item.type === 'run' && write.item.state === 'waiting');
        await expect(h.tick()).rejects.toThrow('simulated crash');
        h.world.advance(TICK);
        await h.tick();
        expect(h.count('confirm')).toBe(2);
        expect(h.values('Tier3.Confirmed')).toEqual([1]);
        const run = h.runs()[0];
        expect(run.confirmRetried).toBe(true);
        expect(run.state).toBe('waiting');
    });

    it('keeps the first confirm-call time across a retry', async () => {
        const h = await harness(TUESDAY + HOUR);
        h.crashOn(write => write.item.type === 'run' && write.item.state === 'waiting');
        await expect(h.tick()).rejects.toThrow('simulated crash');
        const first = h.runs()[0].confirmCallStartedAt;
        h.world.advance(TICK);
        await h.tick();
        expect(h.runs()[0].confirmCallStartedAt).toBe(first);
    });

    it('reconciles a release whose ledger write was lost without calling executeRecovery again', async () => {
        const h = await harness(TUESDAY);
        await h.run(7 * DAY);
        h.crashOn(write => write.item.type === 'run' && write.item.closeReason === 'reenrolled');
        await h.run(DAY + 2 * HOUR);
        expect(h.values('Tier3.Released', { Outcome: 'duplicate' })).toEqual([1]);
        const releases = h.count('release');
        await h.run(HOUR);
        expect(h.count('release')).toBe(releases);
        const run = h.runs().find(r => r.runId.startsWith('daily-2026-10-27'))!;
        expect(run.closeReason).toBe('reenrolled');
    });

    it('an interrupted release (no marker) is quarantined and never retried', async () => {
        const h = await harness(TUESDAY);
        await h.run(7 * DAY);
        const original = h.world.secretStore.write;
        h.world.secretStore.write = async (arn: string, value: AccountSecret) => {
            if (value.lastReleasedRunId) throw new Error('crash');
            return original(arn, value);
        };
        await h.run(DAY + 2 * HOUR);
        h.world.secretStore.write = original;
        const run = h.runs().find(r => r.runId.startsWith('daily-2026-10-27'))!;
        expect(run.closeReason).toBe('release_interrupted');
        expect((await h.pool(run.label)).quarantineReason).toBe('release_interrupted');
        expect(JSON.parse(h.lines.find(l => l.includes('"Tier3.Released":0'))!)).toMatchObject({
            Reason: 'release_interrupted',
        });
    });
});
