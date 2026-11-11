/*
 * Time an MCP tool keeps after its credential batch: the fresh consent read,
 * learner-context synthesis (prompt cache, compaction, the model call),
 * pseudonymization and publication. Learned per tool and per process from
 * measured post-batch durations (an EWMA), starting from
 * MCP_POST_BATCH_RESERVE_MS (configured, default 8s). A call that times out
 * after its batch raises the estimate above what it measured, so the next
 * batch stops earlier. Dependency-free: owner-operation tests stub the env.
 */

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

/** Configured post-batch cost before any call of that tool was measured. */
export const configuredPostBatchMs = (): number =>
    positiveInteger(process.env.MCP_POST_BATCH_RESERVE_MS, 8_000);

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
    (tool && estimates.get(tool)) || configuredPostBatchMs();

/** Reserve for a call of `tool` with `budgetMs`: estimate plus headroom, capped. */
export const postBatchReserveMs = (tool: string | undefined, budgetMs: number): number =>
    Math.min(
        Math.ceil(postBatchEstimateMs(tool) * RESERVE_HEADROOM),
        Math.floor(budgetMs * MAX_RESERVE_SHARE)
    );

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
