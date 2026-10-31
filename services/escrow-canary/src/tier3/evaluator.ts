import type { Emit } from '../metrics';
import type { EvaluatorConfig } from './config';
import type { Ledger, LedgerItem } from './ledger';

export interface Evaluation {
    overdue: number;
    poolAvailable: number;
    startAgeMinutes: number;
    paused: boolean;
}

export class EvaluationError extends Error {
    readonly reason = 'ledger';
    constructor() {
        super('Tier 3 ledger cannot be evaluated');
    }
}

/**
 * Pure deadline evaluation over the WHOLE ledger. Expectedness lives only in
 * the ledger: a step item exists only once it is due-able, so warm-up and the
 * gaps between weekly cancels give Overdue = 0, not missing data.
 *
 * - Overdue: steps past `dueAt` with neither an observation nor an outcome.
 *   An explicit failure (outcome 0) already paged, so it stops counting; a
 *   crash keeps counting until an operator closes the step.
 * - No META yet (before the runner's first tick) is warm-up: StartAge 0.
 * - Paused (operator `tier3-admin pause`): Overdue and StartAge report 0.
 *
 * Throws on any malformed input or a pool count mismatch: the caller then
 * emits NOTHING, so the missing heartbeat pages.
 */
export const evaluate = (items: LedgerItem[], now: number, poolSize: number): Evaluation => {
    if (!Number.isFinite(now)) throw new EvaluationError();
    const metas = items.filter(item => item.type === 'meta');
    const pools = items.filter(item => item.type === 'pool');
    if (metas.length > 1 || pools.length !== poolSize) throw new EvaluationError();
    if (new Set(pools.map(pool => pool.label)).size !== poolSize) throw new EvaluationError();
    const meta = metas[0];
    const paused = meta?.paused === true;
    const poolAvailable = pools.filter(
        pool =>
            (pool.state === 'idle' || pool.state === 'cooling') &&
            (pool.availableAt === undefined || pool.availableAt <= now)
    ).length;
    if (!meta || paused) return { overdue: 0, poolAvailable, startAgeMinutes: 0, paused };
    const runs = new Set(items.filter(item => item.type === 'run').map(item => item.runId));
    let overdue = 0;
    for (const item of items) {
        if (item.type !== 'step') continue;
        // A step without its run header is an inconsistent ledger, not "nothing due".
        if (!runs.has(item.runId)) throw new EvaluationError();
        if (item.dueAt <= now && item.observedAt === undefined && item.outcome === undefined)
            overdue += 1;
    }
    let anchor = meta.enabledAt;
    for (const item of items)
        if (item.type === 'run' && item.startedAt !== undefined)
            anchor = Math.max(anchor, item.startedAt);
    return {
        overdue,
        poolAvailable,
        startAgeMinutes: Math.max(0, Math.floor((now - anchor) / 60_000)),
        paused,
    };
};

/** Emits the gauges, then the heartbeat LAST and only after all of them succeeded. */
export const runEvaluator = async (
    event: { time: string },
    config: EvaluatorConfig,
    deps: { ledger: Ledger; emit: Emit; now?: () => number }
): Promise<Evaluation> => {
    const now = (deps.now ?? Date.now)();
    const time = Date.parse(event.time);
    if (!Number.isFinite(time) || Math.abs(now - time) > 5 * 60_000) throw new EvaluationError();
    const result = evaluate(await deps.ledger.scanAll(), now, config.poolSize);
    const context = { timestamp: now };
    deps.emit('Tier3.Overdue', result.overdue, undefined, undefined, context);
    deps.emit('Tier3.PoolAvailable', result.poolAvailable, undefined, undefined, context);
    deps.emit('Tier3.StartAgeMinutes', result.startAgeMinutes, undefined, undefined, context);
    deps.emit('Tier3.Paused', result.paused ? 1 : 0, undefined, undefined, context);
    deps.emit('Tier3.EvaluatorHeartbeat', 1, undefined, undefined, context);
    return result;
};
