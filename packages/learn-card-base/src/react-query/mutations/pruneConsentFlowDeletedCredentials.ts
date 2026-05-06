import { QueryClient } from '@tanstack/react-query';
import { ConsentFlowTerms } from '@learncard/types';
import { cloneDeep } from 'lodash';

import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

export type PruneDeletedCredentialUrisResult = {
    contractsUpdated: number;
    removedSharedUris: number;
};

export const pruneDeletedUrisFromConsentTerms = (
    terms: ConsentFlowTerms,
    deletedUris: string[]
): { terms: ConsentFlowTerms; removedSharedUris: number } => {
    const deletedUriSet = new Set(deletedUris.filter((uri): uri is string => Boolean(uri)));
    const nextTerms = cloneDeep(terms);

    if (!deletedUriSet.size) {
        return { terms: nextTerms, removedSharedUris: 0 };
    }

    const categories = nextTerms.read?.credentials?.categories ?? {};
    let removedSharedUris = 0;

    for (const categoryInfo of Object.values(categories)) {
        const previousShared = categoryInfo.shared ?? [];
        const nextShared = previousShared.filter(uri => !deletedUriSet.has(uri));

        removedSharedUris += previousShared.length - nextShared.length;
        categoryInfo.shared = nextShared;
    }

    return { terms: nextTerms, removedSharedUris };
};

export const pruneDeletedUrisFromConsentFlow = async ({
    wallet,
    queryClient,
    deletedUris,
}: {
    wallet: BespokeLearnCard;
    queryClient: QueryClient;
    deletedUris: string[];
}): Promise<PruneDeletedCredentialUrisResult> => {
    const uniqueDeletedUris = [
        ...new Set(deletedUris.filter((uri): uri is string => Boolean(uri))),
    ];

    if (!uniqueDeletedUris.length) {
        return { contractsUpdated: 0, removedSharedUris: 0 };
    }

    const ENABLE_CONSENT_PRUNE_LOGS = false;

    const logConsentPrune = (message: string, data?: Record<string, unknown>) => {
        if (!ENABLE_CONSENT_PRUNE_LOGS) return;

        try {
            if (data) {
                console.log(`[ConsentFlowPrune] ${message}`, data);
            } else {
                console.log(`[ConsentFlowPrune] ${message}`);
            }
        } catch {
            // Logging should never break credential cleanup.
        }
    };

    logConsentPrune('Starting targeted prune', {
        deletedUriCount: uniqueDeletedUris.length,
        deletedUris: uniqueDeletedUris,
    });

    const pruneResult = await wallet.invoke.pruneDeletedUrisFromConsentFlow({
        deletedUris: uniqueDeletedUris,
    });

    queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowData'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowDataForDid'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowDataForDidByCategory'] });
    queryClient.invalidateQueries({ queryKey: ['useResolvedConsentFlowDataForDid'] });

    logConsentPrune('Targeted prune completed', {
        contractsUpdated: pruneResult?.contractsUpdated ?? 0,
        removedSharedUris: pruneResult?.removedSharedUris ?? 0,
    });

    return {
        contractsUpdated: pruneResult?.contractsUpdated ?? 0,
        removedSharedUris: pruneResult?.removedSharedUris ?? 0,
    };
};
