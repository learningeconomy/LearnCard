import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';
import {
    LearnCloudCredentialRefreshResult,
    refreshLearnCloudCredential,
} from '../../helpers/credentialRefresh';
import { getLogger } from '../../logging/logger';
import { LCR } from '../../types/credential-records';
import type { BespokeLearnCard } from '../../types/learn-card';

const log = getLogger('credential-refresh-mutation');

export type RefreshLearnCloudCredentialVariables = {
    /** LearnCloud index record to refresh; re-read internally before use and before commit */
    record: LCR;
    /** Bypass the staleness guard (credential detail views, refresh notification taps) */
    force?: boolean;
    wallet?: BespokeLearnCard;
};

/**
 * Refreshes one refreshable LearnCloud credential in place (LC-2117, LC-2135, LC-2136).
 *
 * The mutation never rejects for expected refresh outcomes — inspect the returned
 * `LearnCloudCredentialRefreshResult` status instead. After a successful replacement
 * or check-metadata update, credential and index queries are invalidated so wallet
 * views follow the new current URI.
 */
export const useRefreshLearnCloudCredentialMutation = () => {
    const { initWallet } = useWallet();
    const queryClient = useQueryClient();

    return useMutation<
        LearnCloudCredentialRefreshResult,
        Error,
        RefreshLearnCloudCredentialVariables
    >({
        mutationFn: async ({ record, force, wallet: capturedWallet }) => {
            const wallet = capturedWallet ?? (await initWallet());

            return refreshLearnCloudCredential({ wallet, record, force });
        },
        onSuccess: async result => {
            if (result.status === 'updated' || result.status === 'unchanged') {
                await Promise.all([
                    queryClient.invalidateQueries({ queryKey: ['useGetCredentials'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetIDs'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetResolvedCredential'] }),
                    queryClient.invalidateQueries({ queryKey: ['useGetResolvedCredentials'] }),
                ]);
            }

            if (result.status === 'failed') {
                log.warn('refresh.failed', { code: result.code, retryable: result.retryable });
            }
        },
        onError: error => {
            log.error('refresh.unexpected', error);
        },
    });
};
