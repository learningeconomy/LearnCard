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
    pending: {
        queryKey: QueryKey;
        existed: boolean;
        prompt: LCNConnectionPrompt | undefined;
        index: number;
    };
    status: {
        queryKey: QueryKey;
        state: ReturnType<QueryClient['getQueryState']>;
    };
};

const optimisticallyResolvePrompt = async (
    queryClient: QueryClient,
    did: string,
    promptId: string,
    status: 'SKIPPED' | 'CONNECTED'
): Promise<PromptMutationContext> => {
    const pendingKey = connectionPromptKeys.pending(did);
    const statusKey = connectionPromptKeys.status(did, promptId);
    await Promise.all([
        queryClient.cancelQueries({ queryKey: pendingKey, exact: true }),
        queryClient.cancelQueries({ queryKey: statusKey, exact: true }),
    ]);

    const pending = queryClient.getQueryData<LCNConnectionPrompt[]>(pendingKey);
    const statusState = queryClient.getQueryState<LCNConnectionPromptActionResult>(statusKey);
    const pendingExisted = Boolean(queryClient.getQueryState(pendingKey));
    const pendingIndex = pending?.findIndex(prompt => prompt.promptId === promptId) ?? -1;
    const pendingPrompt = pendingIndex >= 0 ? pending?.[pendingIndex] : undefined;

    if (pending) {
        queryClient.setQueryData<LCNConnectionPrompt[]>(
            pendingKey,
            pending.filter(prompt => prompt.promptId !== promptId)
        );
    }

    queryClient.setQueryData<LCNConnectionPromptActionResult>(statusKey, { promptId, status });

    return {
        pending: {
            queryKey: pendingKey,
            existed: pendingExisted,
            prompt: pendingPrompt,
            index: pendingIndex,
        },
        status: { queryKey: statusKey, state: statusState },
    };
};

const restorePromptSnapshots = (
    queryClient: QueryClient,
    context?: PromptMutationContext
): void => {
    if (!context) return;

    if (context.pending.existed) {
        const current =
            queryClient.getQueryData<LCNConnectionPrompt[]>(context.pending.queryKey) ?? [];
        if (
            context.pending.prompt &&
            !current.some(prompt => prompt.promptId === context.pending.prompt?.promptId)
        ) {
            const restored = [...current];
            restored.splice(
                Math.min(context.pending.index, restored.length),
                0,
                context.pending.prompt
            );
            queryClient.setQueryData(context.pending.queryKey, restored);
        }
    } else {
        queryClient.removeQueries({ queryKey: context.pending.queryKey, exact: true });
    }

    if (context.status.state) {
        queryClient
            .getQueryCache()
            .find({ queryKey: context.status.queryKey, exact: true })
            ?.setState(context.status.state);
    } else {
        queryClient.removeQueries({ queryKey: context.status.queryKey, exact: true });
    }
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
        scope: { id: `connectionPrompt:${switchedDid}` },
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
        scope: { id: `connectionPrompt:${switchedDid}` },
    });
};
