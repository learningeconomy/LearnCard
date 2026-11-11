import { runWithAiPrivacyContext } from '../ai/privacy';
import { LearnCardTimeoutError } from '../learncard/errors';
import { boundLearnCardCall, runWithLearnCardRequestScope } from '../learncard/requestScope';
import { withOwnerOperation } from '../services/dataErasure';

export const mcpToolTimeoutMs = (): number => {
    const parsed = Number(process.env.MCP_TOOL_TIMEOUT_MS);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 20_000;
};

export const runMcpOwnerOperation = async <T>(did: string, operation: () => Promise<T>) => {
    const timeoutMs = mcpToolTimeoutMs();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new LearnCardTimeoutError()), timeoutMs);
    timer.unref?.();
    try {
        return await withOwnerOperation(did, () =>
            runWithAiPrivacyContext(did, () =>
                runWithLearnCardRequestScope({ signal: controller.signal }, () =>
                    boundLearnCardCall(Promise.resolve().then(operation), {
                        signal: controller.signal,
                        timeoutMs,
                    })
                )
            )
        );
    } finally {
        clearTimeout(timer);
    }
};
