import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { GuardianApprovalRequestStatus } from '@learncard/types';
import { useWallet } from 'learn-card-base';

export const GUARDIAN_APPROVAL_STATUS_QUERY_KEY = ['guardian-approval-status'] as const;

export type GuardianSendErrorKind = 'cooldown' | 'inProgress' | 'failed';

/** Maps a send error to a stable kind; switch on this, never on the server message. */
export const getGuardianSendErrorKind = (error: unknown): GuardianSendErrorKind => {
    const code = (error as { data?: { code?: string } } | null)?.data?.code;
    if (code === 'TOO_MANY_REQUESTS') return 'cooldown';
    if (code === 'CONFLICT') return 'inProgress';
    return 'failed';
};

export const useGuardianApprovalStatus = (
    enabled = true,
    options: { refetchInterval?: number } = {}
) => {
    const { initWallet } = useWallet();

    return useQuery({
        queryKey: GUARDIAN_APPROVAL_STATUS_QUERY_KEY,
        enabled,
        refetchInterval: options.refetchInterval,
        refetchOnWindowFocus: true,
        queryFn: async (): Promise<GuardianApprovalRequestStatus> => {
            const wallet = await initWallet();
            return wallet.invoke.getGuardianApprovalStatus();
        },
    });
};

export const useSendGuardianApprovalEmail = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (guardianEmail: string) => {
            const wallet = await initWallet();
            return wallet.invoke.sendGuardianApprovalEmail({ guardianEmail });
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: GUARDIAN_APPROVAL_STATUS_QUERY_KEY }),
    });
};
