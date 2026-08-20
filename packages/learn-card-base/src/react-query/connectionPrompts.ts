import {
    type QueryClient,
    type QueryKey,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { LCNConnectionPrompt, LCNConnectionPromptActionResult } from '@learncard/types';
import { useWallet } from 'learn-card-base';

import { switchedProfileStore } from '../stores/walletStore';

export const connectionPromptKeys = {
    all: ['connectionPrompts'] as const,
    pending: (did = '') => [...connectionPromptKeys.all, 'pending', did] as const,
    status: (did = '', promptId = '') =>
        [...connectionPromptKeys.all, 'status', did, promptId] as const,
};

export const usePendingConnectionPrompts = (enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCNConnectionPrompt[]>({
        queryKey: connectionPromptKeys.pending(switchedDid ?? ''),
        queryFn: async () => {
            const wallet = await initWallet();

            return wallet.invoke.getPendingConnectionPrompts();
        },
        enabled,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
};

export const useConnectionPromptStatus = (promptId?: string, enabled = true) => {
    const { initWallet } = useWallet();
    const switchedDid = switchedProfileStore.use.switchedDid();

    return useQuery<LCNConnectionPromptActionResult>({
        queryKey: connectionPromptKeys.status(switchedDid ?? '', promptId ?? ''),
        queryFn: async () => {
            if (!promptId) throw new Error('A prompt ID is required.');

            const wallet = await initWallet();

            return wallet.invoke.getConnectionPromptStatus(promptId);
        },
        enabled: enabled && Boolean(promptId),
        staleTime: 0,
    });
};

type PromptMutationContext = {
    promptSnapshots: [QueryKey, unknown][];
    createdQueryKeys: QueryKey[];
};

const optimisticallyResolvePrompt = async (
    queryClient: QueryClient,
    did: string,
    promptId: string,
    status: 'SKIPPED' | 'CONNECTED'
): Promise<PromptMutationContext> => {
    await queryClient.cancelQueries({ queryKey: connectionPromptKeys.all });

    const promptSnapshots = queryClient.getQueriesData({ queryKey: connectionPromptKeys.all });
    const pendingKey = connectionPromptKeys.pending(did);
    const statusKey = connectionPromptKeys.status(did, promptId);
    const pending = queryClient.getQueryData<LCNConnectionPrompt[]>(pendingKey);
    const createdQueryKeys = queryClient.getQueryState(statusKey) ? [] : [statusKey];

    if (pending) {
        queryClient.setQueryData<LCNConnectionPrompt[]>(
            pendingKey,
            pending.filter(prompt => prompt.promptId !== promptId)
        );
    }

    queryClient.setQueryData<LCNConnectionPromptActionResult>(statusKey, { promptId, status });

    return { promptSnapshots, createdQueryKeys };
};

const restorePromptSnapshots = (
    queryClient: QueryClient,
    context?: PromptMutationContext
): void => {
    context?.createdQueryKeys.forEach(queryKey => {
        queryClient.removeQueries({ queryKey, exact: true });
    });
    context?.promptSnapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
    });
};

const invalidatePromptActionCaches = async (
    queryClient: QueryClient,
    did: string
): Promise<void> => {
    await Promise.all([
        queryClient.invalidateQueries({ queryKey: connectionPromptKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['connections', did] }),
        queryClient.invalidateQueries({ queryKey: ['paginatedConnections', did] }),
        queryClient.invalidateQueries({ queryKey: ['connection', did] }),
        queryClient.invalidateQueries({ queryKey: ['useGetUserNotifications', did] }),
        queryClient.invalidateQueries({ queryKey: ['useGetUnreadUserNotifications', did] }),
    ]);
};

export const useSkipConnectionPromptMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid() ?? '';

    return useMutation<LCNConnectionPromptActionResult, Error, string, PromptMutationContext>({
        mutationFn: async promptId => {
            const wallet = await initWallet();

            return wallet.invoke.skipConnectionPrompt(promptId);
        },
        onMutate: promptId =>
            optimisticallyResolvePrompt(queryClient, switchedDid, promptId, 'SKIPPED'),
        onError: (_error, _promptId, context) => restorePromptSnapshots(queryClient, context),
        onSuccess: async (result, promptId) => {
            queryClient.setQueryData(connectionPromptKeys.status(switchedDid, promptId), result);
            await invalidatePromptActionCaches(queryClient, switchedDid);
        },
    });
};

export const useConnectWithConnectionPromptMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();
    const switchedDid = switchedProfileStore.use.switchedDid() ?? '';

    return useMutation<LCNConnectionPromptActionResult, Error, string, PromptMutationContext>({
        mutationFn: async promptId => {
            const wallet = await initWallet();

            return wallet.invoke.connectWithConnectionPrompt(promptId);
        },
        onMutate: promptId =>
            optimisticallyResolvePrompt(queryClient, switchedDid, promptId, 'CONNECTED'),
        onError: (_error, _promptId, context) => restorePromptSnapshots(queryClient, context),
        onSuccess: async (result, promptId) => {
            queryClient.setQueryData(connectionPromptKeys.status(switchedDid, promptId), result);
            await invalidatePromptActionCaches(queryClient, switchedDid);
        },
    });
};
