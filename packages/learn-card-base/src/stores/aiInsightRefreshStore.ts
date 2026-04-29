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

export const setAiInsightRefreshPending = ({
    requestedAt,
    baselineCredentialId,
}: {
    requestedAt: number;
    baselineCredentialId: string | null;
}) => {
    aiInsightRefreshStore.set.status('pending');
    aiInsightRefreshStore.set.requestedAt(requestedAt);
    aiInsightRefreshStore.set.baselineCredentialId(baselineCredentialId);
    aiInsightRefreshStore.set.lastError(null);
};

export const clearAiInsightRefreshState = () => {
    aiInsightRefreshStore.set.status('idle');
    aiInsightRefreshStore.set.requestedAt(null);
    aiInsightRefreshStore.set.baselineCredentialId(null);
    aiInsightRefreshStore.set.lastError(null);
};

export const setAiInsightRefreshError = (message: string) => {
    aiInsightRefreshStore.set.status('error');
    aiInsightRefreshStore.set.lastError(message);
};
