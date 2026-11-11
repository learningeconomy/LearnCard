/*
 * Time an MCP tool keeps after its credential batch: the fresh consent read,
 * learner-context synthesis (prompt cache, the model call), pseudonymization,
 * and for get_answer_about_user the search and the answer's model call.
 * Learned per tool and per process from measured post-batch durations (an
 * EWMA). Until a tool is measured on this machine, a conservative per-tool
 * default holds: v33 measured a 9.8s model call on prod, so each model call
 * after the batch is budgeted at 10s. MCP_POST_BATCH_RESERVE_MS overrides the
 * default for every tool. A call that times out after its batch raises the
 * estimate above what it measured. Dependency-free: owner-operation tests
 * stub the env.
 */

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/* Unmeasured defaults: fresh consent read (~0.7s) + one 10s model call +
 * pseudonymize and margin; get_answer adds a bounded search (6s) and keeps
 * its own fresh read before the answer's model call. */
const DEFAULT_POST_BATCH_MS: Record<string, number> = {
    get_user_context: 13_000,
    get_answer_about_user: 19_000,
};

/** Configured post-batch cost before any call of that tool was measured. */
export const configuredPostBatchMs = (tool?: string): number =>
    positiveInteger(
        process.env.MCP_POST_BATCH_RESERVE_MS,
        (tool && DEFAULT_POST_BATCH_MS[tool]) || 13_000
    );

/** Weight of the newest measurement. */
const EWMA_ALPHA = 0.3;
/** Headroom on top of the estimate (model latency varies call to call). */
const RESERVE_HEADROOM = 1.25;
/** After a post-batch timeout, the estimate jumps to this multiple of what ran. */
const TIMEOUT_BACKOFF = 1.5;
const MIN_ESTIMATE_MS = 1_000;
const MAX_ESTIMATE_MS = 120_000;
/** The reserve never takes more than this share of the request budget. */
export const MAX_RESERVE_SHARE = 0.6;

const estimates = new Map<string, number>();

const clamp = (ms: number) => Math.min(MAX_ESTIMATE_MS, Math.max(MIN_ESTIMATE_MS, ms));

/** Current post-batch estimate for `tool` (configured until measured). */
export const postBatchEstimateMs = (tool: string | undefined): number =>
    (tool && estimates.get(tool)) || configuredPostBatchMs(tool);

/** Reserve for a call of `tool` with `budgetMs`: the measured estimate plus
 *  headroom, or the conservative configured default; capped. */
export const postBatchReserveMs = (tool: string | undefined, budgetMs: number): number => {
    const measured = tool ? estimates.get(tool) : undefined;
    return Math.min(
        measured === undefined
            ? configuredPostBatchMs(tool)
            : Math.ceil(measured * RESERVE_HEADROOM),
        Math.floor(budgetMs * MAX_RESERVE_SHARE)
    );
};

/** Record what ran after the batch: the whole tail on success, a lower bound on timeout. */
export const recordPostBatchMs = (
    tool: string | undefined,
    ms: number,
    outcome: 'success' | 'failure' | 'timeout'
): void => {
    if (!tool || !Number.isFinite(ms) || ms < 0 || outcome === 'failure') return;
    const current = postBatchEstimateMs(tool);
    const next =
        outcome === 'timeout'
            ? Math.max(current, ms) * TIMEOUT_BACKOFF
            : current + EWMA_ALPHA * (ms - current);
    estimates.set(tool, clamp(Math.round(next)));
};

/** Test hook: forget measured estimates. */
export const resetPostBatchEstimates = (): void => estimates.clear();
