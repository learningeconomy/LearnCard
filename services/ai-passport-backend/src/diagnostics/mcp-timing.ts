import { getMcpProgress, type McpProgressContext } from './mcp-progress';

/*
 * Per-request stage timing for one MCP tool call: how many times each stage
 * ran and its summed wall time (concurrent work overlaps, so totals can exceed
 * the request's duration). Logged once as mcp_tool_timing when the call ends,
 * on success, failure or timeout. Stage names are fixed; nothing else is kept.
 */
export const MCP_TIMING_STAGES = [
    'scope',
    'consent_read',
    'uri_list',
    'read',
    'verify',
    'store',
    'projection',
    // Sub-stages of projection beyond read and verify: the owner-operation /
    // consent-snapshot fence checks, SDK init, building the projection, and
    // whatever is left (computed at snapshot: projection minus all of these).
    'fence',
    'sdk_init',
    'project',
    'projection_other',
    'batch',
    'learnercontext',
    'search',
    'pseudonymize',
    'llm',
    // Consent reads that reached the consent store (consent_read counts calls).
    'consent_live',
] as const;
export type McpTimingStage = (typeof MCP_TIMING_STAGES)[number];
export type McpStageTimings = Partial<Record<McpTimingStage, { count: number; ms: number }>>;

type OpenStage = { stage: McpTimingStage; startedAt: number };
export type McpBatchCounts = {
    loadedCount: number;
    skippedCount: number;
    deferredCount: number;
    /** Not considered: known bad (cached or stored) or over the per-call cap. */
    excludedCount: number;
};
type McpTiming = {
    stages: McpStageTimings;
    /* Stages still running; a timeout snapshot counts them up to now. */
    open: Set<OpenStage>;
    credentialCount?: number;
    batch?: McpBatchCounts;
};
const timings = new WeakMap<McpProgressContext, McpTiming>();

const timingOf = (context: McpProgressContext): McpTiming => {
    let timing = timings.get(context);
    if (!timing) {
        timing = { stages: {}, open: new Set() };
        timings.set(context, timing);
    }
    return timing;
};

export const recordMcpStage = (stage: McpTimingStage, ms: number): void => {
    const context = getMcpProgress();
    if (!context) return;
    const stages = timingOf(context).stages;
    const entry = (stages[stage] ??= { count: 0, ms: 0 });
    entry.count += 1;
    entry.ms += Math.max(0, ms);
};

/** Time one stage of the current MCP call; a no-op wrapper outside one. */
export const timeMcpStage = async <T>(
    stage: McpTimingStage,
    operation: () => Promise<T> | T
): Promise<T> => {
    const context = getMcpProgress();
    if (!context) return operation();
    const open: OpenStage = { stage, startedAt: performance.now() };
    const timing = timingOf(context);
    timing.open.add(open);
    try {
        return await operation();
    } finally {
        timing.open.delete(open);
        recordMcpStage(stage, performance.now() - open.startedAt);
    }
};

export const recordMcpCredentialCount = (count: number): void => {
    const context = getMcpProgress();
    if (context) timingOf(context).credentialCount = count;
};

/** The credential batch's outcome, so mcp_tool_timing carries it even on a timeout. */
export const recordMcpBatchCounts = (counts: McpBatchCounts): void => {
    const context = getMcpProgress();
    if (context) timingOf(context).batch = { ...counts };
};

const PROJECTION_PARTS = ['read', 'verify', 'fence', 'sdk_init', 'project'] as const;

/** Snapshot for logging: whole milliseconds, fixed stage keys only. */
export const mcpTimingSnapshot = (
    context: McpProgressContext,
    now = performance.now()
): { stageTimings: McpStageTimings; credentialCount?: number } & Partial<McpBatchCounts> => {
    const timing = timingOf(context);
    const totals: McpStageTimings = {};
    for (const stage of MCP_TIMING_STAGES) {
        const entry = timing.stages[stage];
        if (entry) totals[stage] = { ...entry };
    }
    // A stage still running (the call timed out inside it) counts up to now.
    for (const { stage, startedAt } of timing.open) {
        const entry = (totals[stage] ??= { count: 0, ms: 0 });
        entry.count += 1;
        entry.ms += Math.max(0, now - startedAt);
    }
    // Projection time not in a measured sub-stage: queueing, logging, event-loop
    // delay, retries, cache bookkeeping.
    const projection = totals.projection;
    if (projection) {
        const parts = PROJECTION_PARTS.reduce((sum, stage) => sum + (totals[stage]?.ms ?? 0), 0);
        totals.projection_other = {
            count: projection.count,
            ms: Math.max(0, projection.ms - parts),
        };
    }
    const stageTimings: McpStageTimings = {};
    for (const stage of MCP_TIMING_STAGES) {
        const entry = totals[stage];
        if (entry) stageTimings[stage] = { count: entry.count, ms: Math.round(entry.ms) };
    }
    return {
        stageTimings,
        ...(timing.credentialCount === undefined
            ? {}
            : { credentialCount: timing.credentialCount }),
        ...(timing.batch ?? {}),
    };
};
