import { runWithAiPrivacyContext } from '../ai/privacy';
import { LearnCardTimeoutError } from '../learncard/errors';
import { boundLearnCardCall, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { withOwnerOperation } from '../services/dataErasure';
import { postBatchReserveMs, recordPostBatchMs } from '../diagnostics/post-batch-reserve';

export type McpToolName = 'get_user_context' | 'get_answer_about_user' | 'save_session_summary';

export const mcpToolTimeoutMs = (): number => {
    const parsed = Number(process.env.MCP_TOOL_TIMEOUT_MS);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 45_000;
};

export const runMcpOwnerOperation = async <T>(
    did: string,
    operation: () => Promise<T>,
    tool?: McpToolName
) => {
    const timeoutMs = mcpToolTimeoutMs();
    const controller = new AbortController();
    const deadlineAt = performance.now() + timeoutMs;
    const timer = setTimeout(() => controller.abort(new LearnCardTimeoutError()), timeoutMs);
    timer.unref?.();
    // Background store writes for this owner wait while this call reads (the
    // in-app preload's yield to a chat start: credentials/batch.ts).
    const contextRead = await import('../credentials/batch')
        .then(batch => batch.beginCredentialContextRead(did))
        .catch(() => undefined);
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
        contextRead?.();
        // The post-batch reserve learns from what this call measured.
        if (batchEndedAt !== undefined)
            recordPostBatchMs(tool, performance.now() - batchEndedAt, outcome);
    }
};
