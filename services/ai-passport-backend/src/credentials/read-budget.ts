import { getLearnCardMeanTaskMs, getLearnCardRequestBudget } from '../learncard/requestScope';

/*
 * Credential budget inside a request with a deadline (MCP tools). The batch
 * stops starting credentials once the time left, minus the post-batch reserve
 * (the fresh consent read, learner-context synthesis, pseudonymization and the
 * model call), is too short for one more credential task; the unstarted ones
 * are deferred and the tool returns context from what loaded. The reserve is
 * the tool's measured post-batch cost (see diagnostics/post-batch-reserve),
 * set on the request scope. Each read gets the smaller of a fixed cap and the
 * time left before that reserve. Env knobs are read directly (tests of modules
 * that load this one replace the env module).
 */

const positiveInteger = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

type RequestBudget = { deadlineAt: number; budgetMs: number; postBatchReserveMs?: number };

/** Longest any one credential read may take under a request deadline. */
export const credentialReadCapMs = (): number =>
    positiveInteger(process.env.CREDENTIAL_READ_TIMEOUT_MS, 3_000);

/** Shortest read timeout we hand out: prod reads take ~125ms and up. */
export const CREDENTIAL_READ_FLOOR_MS = 500;

/** A credential is not started with less than this left before the reserve. */
export const CREDENTIAL_MIN_START_MS = 500;

/** Headroom on the mean task time: a task started now must end before the reserve. */
const TASK_HEADROOM = 1.5;

/** Time kept after the batch. Requests without a measured reserve keep
 *  MCP_POST_BATCH_RESERVE_MS (8s), at most 60% of the request budget. */
export const synthesisReserveMs = (budget: RequestBudget): number =>
    budget.postBatchReserveMs ??
    Math.min(
        positiveInteger(process.env.MCP_POST_BATCH_RESERVE_MS, 8_000),
        Math.floor(budget.budgetMs * 0.6)
    );

const credentialTimeLeftMs = (budget: RequestBudget, now: number): number =>
    budget.deadlineAt - now - synthesisReserveMs(budget);

/** Past the reserve, the hard stop waits this long so a read bounded to the
 *  reserve (credentialReadTimeoutMs) times out and is reported as a skip
 *  before the stop abandons it as deferred. */
export const CREDENTIAL_BATCH_STOP_GRACE_MS = 250;

/** When the credential batch must return under a request deadline: the
 *  deadline minus the post-batch reserve, plus the grace. Undefined with no
 *  deadline. */
export const credentialBatchStopAt = (
    budget: RequestBudget | undefined = getLearnCardRequestBudget()
): number | undefined =>
    budget === undefined
        ? undefined
        : budget.deadlineAt - synthesisReserveMs(budget) + CREDENTIAL_BATCH_STOP_GRACE_MS;

/** Time one more credential task needs: its measured mean in this request,
 *  with headroom; CREDENTIAL_MIN_START_MS until one has finished. */
export const credentialTaskEstimateMs = (meanTaskMs = getLearnCardMeanTaskMs()): number =>
    Math.max(CREDENTIAL_MIN_START_MS, Math.ceil((meanTaskMs ?? 0) * TASK_HEADROOM));

/** Whether the batch may start another credential: it must finish before the
 *  post-batch reserve. Always true with no deadline. */
export const credentialBudgetAllowsStart = ({
    now = performance.now(),
    budget = getLearnCardRequestBudget(),
    meanTaskMs = getLearnCardMeanTaskMs(),
}: { now?: number; budget?: RequestBudget; meanTaskMs?: number } = {}): boolean =>
    budget === undefined ||
    credentialTimeLeftMs(budget, now) >= credentialTaskEstimateMs(meanTaskMs);

export const credentialReadTimeoutMs = ({
    now = performance.now(),
    budget = getLearnCardRequestBudget(),
}: { now?: number; budget?: RequestBudget } = {}): number | undefined => {
    // Without a request deadline the read keeps LEARNCARD_CALL_TIMEOUT_MS.
    if (budget === undefined) return undefined;
    const cap = credentialReadCapMs();
    return Math.max(
        CREDENTIAL_READ_FLOOR_MS,
        Math.min(cap, Math.floor(credentialTimeLeftMs(budget, now)))
    );
};
