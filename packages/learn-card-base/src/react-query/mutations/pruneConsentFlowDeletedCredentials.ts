import { QueryClient } from '@tanstack/react-query';
import { ConsentFlowTerms } from '@learncard/types';
import { cloneDeep } from 'lodash';

import { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { getLogger } from '../../logging/logger';
const log = getLogger('prune-consent-flow-deleted-credentials');

export type DeleteCredentialFromAllContractsResult = {
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

export const deleteCredentialFromAllContracts = async ({
    wallet,
    queryClient,
    deletedUris,
}: {
    wallet: BespokeLearnCard;
    queryClient: QueryClient;
    deletedUris: string[];
}): Promise<DeleteCredentialFromAllContractsResult> => {
    const uniqueDeletedUris = [
        ...new Set(deletedUris.filter((uri): uri is string => Boolean(uri))),
    ];

    if (!uniqueDeletedUris.length) {
        return { contractsUpdated: 0, removedSharedUris: 0 };
    }

    const ENABLE_CREDENTIAL_CLEANUP_LOGS = false;

    const logCredentialCleanup = (message: string, data?: Record<string, unknown>) => {
        if (!ENABLE_CREDENTIAL_CLEANUP_LOGS) return;

        try {
            if (data) {
                log.debug(`[CredentialCleanup] ${message}`, data);
            } else {
                log.debug(`[CredentialCleanup] ${message}`);
            }
        } catch {
            // Logging should never break credential cleanup.
        }
    };

    logCredentialCleanup('Starting credential cleanup', {
        deletedUriCount: uniqueDeletedUris.length,
        deletedUris: uniqueDeletedUris,
    });

    const cleanupResult = await wallet.invoke.deleteCredentialFromAllContracts({
        deletedUris: uniqueDeletedUris,
    });

    queryClient.invalidateQueries({ queryKey: ['useConsentedContracts'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowData'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowDataForDid'] });
    queryClient.invalidateQueries({ queryKey: ['useConsentFlowDataForDidByCategory'] });
    queryClient.invalidateQueries({ queryKey: ['useResolvedConsentFlowDataForDid'] });

    logCredentialCleanup('Credential cleanup completed', {
        contractsUpdated: cleanupResult?.contractsUpdated ?? 0,
        removedSharedUris: cleanupResult?.removedSharedUris ?? 0,
    });

    return {
        contractsUpdated: cleanupResult?.contractsUpdated ?? 0,
        removedSharedUris: cleanupResult?.removedSharedUris ?? 0,
    };
};
