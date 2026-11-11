import { runWithAiPrivacyContext } from '../ai/privacy';
import { LearnCardTimeoutError } from '../learncard/errors';
import { boundLearnCardCall, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { withOwnerOperation } from '../services/dataErasure';
import { getMcpProgress } from '../diagnostics/mcp-progress';
import { mcpTimingSnapshot } from '../diagnostics/mcp-timing';
import { logSafeEvent } from '../logging';

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
    let outcome: 'success' | 'failure' | 'timeout' = 'failure';
    try {
        return await withOwnerOperation(did, () =>
            runWithAiPrivacyContext(did, () =>
                runWithLearnCardRequestScope(
                    { signal: controller.signal, deadlineAt, budgetMs: timeoutMs },
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
        // One line per MCP call, on success, failure or timeout: per-stage
        // counts and summed ms (allowlisted keys only) plus the credential count.
        const progress = getMcpProgress();
        if (progress) {
            logSafeEvent('info', 'mcp_tool_timing', {
                mcpTool: progress.tool,
                mcpRequestId: progress.requestId,
                mcpOutcome: outcome,
                durationMs: Math.round(performance.now() - startedAt),
                ...mcpTimingSnapshot(progress),
            });
        }
    }
};
