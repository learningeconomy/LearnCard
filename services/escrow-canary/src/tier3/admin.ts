import { holdLabel, TIER3_POOL_SIZE } from './config';
import { evaluate } from './evaluator';
import {
    create,
    keys,
    replace,
    type Ledger,
    type LedgerItem,
    type MetaItem,
    type PoolItem,
    type RunItem,
    type StepItem,
    type StepName,
} from './ledger';
import { HOUR, runTtlSeconds, ttlSeconds } from './timing';

/**
 * Operator actions on the tier-3 ledger. Every change is a conditional write;
 * none touches secrets, escrow state, or the inbox. Record each use.
 */
export interface AdminContext {
    ledger: Ledger;
    environment: 'staging' | 'production';
    now: number;
}

/** Precondition for enabling tier 3: twelve idle pool items. Never creates META. */
export const initPool = async ({ ledger, environment, now }: AdminContext): Promise<number> => {
    const existing = await ledger.getMany(
        Array.from({ length: TIER3_POOL_SIZE }, (_, index) => keys.pool(holdLabel(index)))
    );
    const present = new Set(existing.map(item => item.pk));
    const writes = Array.from({ length: TIER3_POOL_SIZE }, (_, index) => holdLabel(index))
        .filter(label => !present.has(keys.pool(label).pk))
        .map(label =>
            create({
                ...keys.pool(label),
                type: 'pool',
                env: environment,
                version: 1,
                updatedAt: now,
                label,
                state: 'idle',
                stateSince: now,
                lastReturnedAt: 0,
                orphanCleanupAttempted: false,
            })
        );
    await ledger.write(writes);
    return writes.length;
};

/**
 * Ready to set tier3_enabled: exactly twelve pool items and an evaluable ledger.
 * Also anchors StartAge: it creates META (enabledAt = now) or, while no run has
 * ever been recorded, re-anchors it. StartAge therefore never depends on the
 * runner completing a tick. Run it within an hour before the apply that sets
 * tier3_enabled=true (the first start follows within 24 h, the alarm is 26 h).
 */
export const checkReady = async ({ ledger, environment, now }: AdminContext): Promise<void> => {
    const items = await ledger.scanAll();
    const metas = items.filter((item): item is MetaItem => item.type === 'meta');
    const existing = metas.length === 1 ? metas[0] : undefined;
    const runsRecorded = items.some(item => item.type === 'run');
    const anchor = !existing || (!existing.paused && !runsRecorded);
    const next: MetaItem = existing
        ? { ...existing, ...(anchor ? { enabledAt: now } : {}) }
        : {
              ...keys.meta,
              type: 'meta',
              env: environment,
              version: 1,
              updatedAt: now,
              enabledAt: now,
              paused: false,
          };
    // Validate (pool count, labels, open-step integrity) before writing anything.
    evaluate(
        metas.length > 1 ? items : [...items.filter(item => item.type !== 'meta'), next],
        now,
        TIER3_POOL_SIZE
    );
    if (!existing) await ledger.write([create(next)]);
    else if (anchor) await ledger.write([replace(existing, { enabledAt: now }, now)]);
};

/** Close one open step (overdue after a crash) with an operator outcome. */
export const closeStep = async (
    { ledger, now }: AdminContext,
    runId: string,
    name: StepName
): Promise<void> => {
    const step = (await ledger.get(keys.step(runId, name))) as StepItem | undefined;
    if (!step || step.observedAt !== undefined || step.outcome !== undefined)
        throw new Error('Step is not open');
    await ledger.write([
        replace(
            step,
            { outcome: 'operator_closed', reason: 'operator_closed', expiresAt: ttlSeconds(now) },
            now
        ),
    ]);
};

/**
 * Escape hatch for a run stuck in any non-closed state: closes the run, marks
 * its open steps `operator_closed` and moves the account to `orphaned` (the
 * runner then cancels any pending hold once through the user's own cancel
 * path) or `quarantined` (operator repairs, then `unquarantine`).
 */
export const closeRun = async (
    { ledger, now }: AdminContext,
    runId: string,
    poolState: 'orphaned' | 'quarantined'
): Promise<void> => {
    const items = await ledger.run(runId);
    const run = items.find((item): item is RunItem => item.type === 'run');
    if (!run || run.state === 'closed') throw new Error('Run is not open');
    const pool = (await ledger.get(keys.pool(run.label))) as PoolItem | undefined;
    if (!pool || pool.state !== 'busy' || pool.runId !== runId)
        throw new Error('Account is not busy with this run');
    const expiresAt = ttlSeconds(now);
    await ledger.write([
        replace(
            run,
            {
                state: 'closed',
                closedAt: now,
                closeReason: 'operator_closed',
                expiresAt: runTtlSeconds(now),
            },
            now
        ),
        replace(
            pool,
            {
                state: poolState,
                runId: undefined,
                stateSince: now,
                availableAt: undefined,
                orphanCleanupAttempted: false,
                quarantineReason: poolState === 'quarantined' ? 'operator_closed' : undefined,
            },
            now
        ),
        ...items
            .filter((item): item is StepItem => item.type === 'step')
            .map(step =>
                step.observedAt !== undefined || step.outcome !== undefined
                    ? replace(step, { expiresAt }, now)
                    : replace(
                          step,
                          { outcome: 'operator_closed', reason: 'operator_closed', expiresAt },
                          now
                      )
            ),
    ]);
};

/** Return a quarantined account to the pool after an owner-path repair. */
export const unquarantine = async ({ ledger, now }: AdminContext, label: string): Promise<void> => {
    const pool = (await ledger.get(keys.pool(label))) as PoolItem | undefined;
    if (!pool || pool.state !== 'quarantined') throw new Error('Account is not quarantined');
    await ledger.write([
        replace(
            pool,
            {
                state: 'idle',
                quarantineReason: undefined,
                runId: undefined,
                stateSince: now,
                orphanCleanupAttempted: false,
            },
            now
        ),
    ]);
};

/**
 * Pause stops the runner (no secret access) and makes the evaluator report
 * Overdue/StartAge 0 with Paused=1. Wait for in-flight executions to finish
 * (one 15-minute tick) before rotating credentials.
 */
export const pause = async ({ ledger, now }: AdminContext): Promise<void> => {
    const meta = (await ledger.get(keys.meta)) as MetaItem | undefined;
    if (!meta) throw new Error('Tier 3 has not started');
    if (meta.paused) throw new Error('Already paused');
    await ledger.write([replace(meta, { paused: true, pausedAt: now }, now)]);
};

/** Resume re-anchors StartAge and gives open steps a one-hour catch-up grace. */
export const resume = async ({ ledger, now }: AdminContext): Promise<void> => {
    const items = await ledger.scanAll();
    const meta = items.find((item): item is MetaItem => item.type === 'meta');
    if (!meta?.paused) throw new Error('Not paused');
    const grace = now + HOUR;
    const steps = items.filter(
        (item): item is StepItem =>
            item.type === 'step' &&
            item.observedAt === undefined &&
            item.outcome === undefined &&
            item.dueAt < grace
    );
    // One transaction per 25 steps keeps well under DynamoDB's limit; META last.
    for (let index = 0; index < steps.length; index += 25)
        await ledger.write(
            steps.slice(index, index + 25).map(step => replace(step, { dueAt: grace }, now))
        );
    await ledger.write([
        replace(meta, { paused: false, pausedAt: undefined, enabledAt: now }, now),
    ]);
};

/** Staging drill only: an open step already past due. Refused in code for production. */
export const injectOverdue = async ({
    ledger,
    environment,
    now,
}: AdminContext): Promise<string> => {
    if (environment !== 'staging') throw new Error('inject-overdue is staging-only');
    // The ledger's own items must say staging too, whatever the operator typed.
    const pool = await ledger.get(keys.pool(holdLabel(0)));
    if (!pool || pool.env !== 'staging') throw new Error('inject-overdue is staging-only');
    const runId = `drill-${now}`;
    const common = { env: environment, version: 1, updatedAt: now };
    await ledger.write([
        create({
            ...keys.run(runId),
            ...common,
            type: 'run',
            runId,
            kind: 'daily',
            label: 'hold-00',
            state: 'closed',
            startRequestedAt: now,
            closedAt: now,
            closeReason: 'drill',
            expiresAt: runTtlSeconds(now),
        }),
        create({
            ...keys.step(runId, 'Warning'),
            ...common,
            type: 'step',
            runId,
            name: 'Warning',
            dueAt: now - 60_000,
            expiresAt: ttlSeconds(now),
        }),
    ]);
    return runId;
};

/** Non-secret summary lines for `list`. */
export const summarize = (items: LedgerItem[]): string[] =>
    items
        .filter(item => item.type !== 'slot')
        .sort((a, b) => `${a.pk}${a.sk}`.localeCompare(`${b.pk}${b.sk}`))
        .map(item => {
            switch (item.type) {
                case 'meta':
                    return `META enabledAt=${new Date(item.enabledAt).toISOString()} paused=${item.paused}`;
                case 'pool':
                    return `${item.label} ${item.state}${item.quarantineReason ? ` (${item.quarantineReason})` : ''}${item.runId ? ` run=${item.runId}` : ''}`;
                case 'run':
                    return `RUN ${item.runId} ${item.state}${item.closeReason ? ` (${item.closeReason})` : ''}`;
                case 'step':
                    return `  ${item.runId} ${item.name} due=${new Date(item.dueAt).toISOString()} ${item.outcome ?? (item.observedAt ? 'observed' : 'open')}`;
                default:
                    return '';
            }
        });
