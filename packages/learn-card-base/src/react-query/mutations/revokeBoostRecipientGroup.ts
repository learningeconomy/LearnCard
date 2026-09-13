import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import type { RevokeBoostRecipientGroupResult } from '@learncard/types';
import { useWallet } from '../../hooks/useWallet';

export interface RevokeBoostRecipientGroupParams {
    boostUri: string;
    recipientProfileId: string;
}

const INVALIDATION_PREFIXES = [
    ['boostRecipients'],
    ['paginatedBoostRecipients'],
    ['useCountBoostRecipients'],
    ['boosts'],
    ['useNetworkMembers'],
    ['getMyActivities'],
    ['getActivityStats'],
    ['credentialStatus'],
] as const;

export const useRevokeBoostRecipientGroup = (): UseMutationResult<
    RevokeBoostRecipientGroupResult,
    Error,
    RevokeBoostRecipientGroupParams
> => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<RevokeBoostRecipientGroupResult, Error, RevokeBoostRecipientGroupParams>({
        mutationFn: async ({ boostUri, recipientProfileId }) => {
            const wallet = await initWallet();
            const method = wallet?.invoke?.revokeBoostRecipientGroup;
            if (!method) throw new Error('Group removal is unavailable');
            return method(boostUri, recipientProfileId);
        },
        onSettled: async () => {
            await Promise.all(
                INVALIDATION_PREFIXES.map(queryKey =>
                    queryClient.invalidateQueries({ queryKey: [...queryKey] })
                )
            );
        },
    });
};
