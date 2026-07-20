import { createStore } from '@udecode/zustood';

export type AiInsightRefreshStatus = 'idle' | 'pending' | 'error';

import { getLogger } from '../logging/logger';
const log = getLogger('ai-insight-refresh-store');

export type AiInsightRefreshState = {
    status: AiInsightRefreshStatus;
    requestedAt: number | null;
    baselineCredentialId: string | null;
    lastError: string | null;
};

export const aiInsightRefreshStore = createStore('aiInsightRefreshStore')<AiInsightRefreshState>({
    status: 'idle',
    requestedAt: null,
    baselineCredentialId: null,
    lastError: null,
});

const ENABLE_AI_INSIGHT_REFRESH_STORE_LOGS = false;

const logAiInsightRefreshStore = (message: string, data?: Record<string, unknown>) => {
    if (!ENABLE_AI_INSIGHT_REFRESH_STORE_LOGS) return;

    try {
        if (data) {
            log.debug(`[AiInsightRefresh] ${message}`, data);
        } else {
            log.debug(`[AiInsightRefresh] ${message}`);
        }
    } catch {
        // logging should never break refresh state transitions
    }
};

export const setAiInsightRefreshPending = ({
    requestedAt,
    baselineCredentialId,
}: {
    requestedAt: number;
    baselineCredentialId: string | null;
}) => {
    logAiInsightRefreshStore('Set pending', { requestedAt, baselineCredentialId });
    aiInsightRefreshStore.set.status('pending');
    aiInsightRefreshStore.set.requestedAt(requestedAt);
    aiInsightRefreshStore.set.baselineCredentialId(baselineCredentialId);
    aiInsightRefreshStore.set.lastError(null);
};

export const clearAiInsightRefreshState = () => {
    logAiInsightRefreshStore('Cleared refresh state');
    aiInsightRefreshStore.set.status('idle');
    aiInsightRefreshStore.set.requestedAt(null);
    aiInsightRefreshStore.set.baselineCredentialId(null);
    aiInsightRefreshStore.set.lastError(null);
};

export const setAiInsightRefreshError = (message: string) => {
    logAiInsightRefreshStore('Set error', { message });
    aiInsightRefreshStore.set.status('error');
    aiInsightRefreshStore.set.lastError(message);
};
