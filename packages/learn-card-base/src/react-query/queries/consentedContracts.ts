import { queryOptions } from '@tanstack/react-query';
import type { PaginatedConsentFlowTerms } from '@learncard/types';
import type { BespokeLearnCard } from '../../types/learn-card';

export const CONSENTED_CONTRACTS_STALE_TIME = 30 * 1000;

/** Shared hook/helper policy; keep the profile prefix used by consent mutations. */
export const consentedContractsQueryOptions = (
    wallet: BespokeLearnCard | null,
    switchedDid: string = ''
) =>
    queryOptions({
        queryKey: ['useConsentedContracts', switchedDid, wallet?.id.did() ?? ''],
        staleTime: CONSENTED_CONTRACTS_STALE_TIME,
        queryFn: async (): Promise<PaginatedConsentFlowTerms['records']> => {
            if (!wallet) throw new Error('Account reader is not ready');
            let result = await wallet.invoke.getConsentedContracts();
            const contracts = [...result.records];
            while (result.hasMore) {
                result = await wallet.invoke.getConsentedContracts({ cursor: result.cursor });
                contracts.push(...result.records);
            }
            return contracts;
        },
    });
