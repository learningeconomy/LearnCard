import { runWithAiPrivacyContext } from '../ai/privacy';
import { LearnCardTimeoutError } from '../learncard/errors';
import { boundLearnCardCall, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { withOwnerOperation } from '../services/dataErasure';
import { getMcpProgress } from '../diagnostics/mcp-progress';
import { mcpTimingSnapshot } from '../diagnostics/mcp-timing';
import { postBatchReserveMs, recordPostBatchMs } from '../diagnostics/post-batch-reserve';

export const mcpToolTimeoutMs = (): number => {
    const parsed = Number(process.env.MCP_TOOL_TIMEOUT_MS);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 20_000;
};

export const runMcpOwnerOperation = async <T>(did: string, operation: () => Promise<T>) => {
    const timeoutMs = mcpToolTimeoutMs();
    const controller = new AbortController();
    const deadlineAt = performance.now() + timeoutMs;
    const timer = setTimeout(() => controller.abort(new LearnCardTimeoutError()), timeoutMs);
    timer.unref?.();
    const startedAt = performance.now();
    const tool = getMcpProgress()?.tool;
    let batchEndedAt: number | undefined;
    let outcome: 'success' | 'failure' | 'timeout' = 'failure';
    try {
        return await withOwnerOperation(did, () =>
            runWithAiPrivacyContext(did, () =>
                runWithLearnCardRequestScope(
                    {
                        signal: controller.signal,
                        deadlineAt,
                        budgetMs: timeoutMs,
                        // Measured post-batch cost of this tool (configured until measured).
                        postBatchReserveMs: postBatchReserveMs(tool, timeoutMs),
                        // The tool never waits on store writes.
                        deferStores: true,
                        onBatchEnded: at => {
                            batchEndedAt = at;
                        },
                    },
                    () =>
                        boundLearnCardCall(Promise.resolve().then(operation), {
                            signal: controller.signal,
                            timeoutMs,
                        })
                )
            )
        ).then(result => {
            outcome = 'success';
            return result;
        });
    } catch (error) {
        if (controller.signal.aborted) outcome = 'timeout';
        throw error;
    } finally {
        clearTimeout(timer);
        if (batchEndedAt !== undefined)
            recordPostBatchMs(tool, performance.now() - batchEndedAt, outcome);
        // One line per MCP call, on success, failure or timeout: per-stage
        // counts and summed ms (allowlisted keys only) plus the credential count.
        // Logging is loaded lazily, like withCauseStep, so this module keeps a
        // small import graph (callers' tests stub a minimal env).
        const progress = getMcpProgress();
        if (progress) {
            const snapshot = {
                durationMs: Math.round(performance.now() - startedAt),
                ...mcpTimingSnapshot(progress),
            };
            const { logSafeEvent } = await import('../logging');
            logSafeEvent('info', 'mcp_tool_timing', {
                mcpTool: progress.tool,
                mcpRequestId: progress.requestId,
                mcpOutcome: outcome,
                ...snapshot,
            });
        }
    }
};
