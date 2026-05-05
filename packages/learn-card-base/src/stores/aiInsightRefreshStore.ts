import { createStore } from '@udecode/zustood';

export type AiInsightRefreshStatus = 'idle' | 'pending' | 'error';

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

const logAiInsightRefreshStore = (message: string, data?: Record<string, unknown>) => {
    try {
        if (data) {
            console.log(`[AiInsightRefresh] ${message}`, data);
        } else {
            console.log(`[AiInsightRefresh] ${message}`);
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
