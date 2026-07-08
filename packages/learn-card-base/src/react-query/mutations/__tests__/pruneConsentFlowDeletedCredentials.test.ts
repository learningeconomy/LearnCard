import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ConsentFlowTerms } from '@learncard/types';
import {
    deleteCredentialFromAllContracts,
    pruneDeletedUrisFromConsentTerms,
} from '../pruneConsentFlowDeletedCredentials';

describe('pruneDeletedUrisFromConsentTerms', () => {
    it('removes deleted URIs from every shared category and preserves the rest', () => {
        const terms = {
            read: {
                credentials: {
                    categories: {
                        Achievement: {
                            shared: ['keep-uri', 'delete-uri'],
                        },
                        ID: {
                            shared: ['id-uri'],
                        },
                    },
                },
            },
        } as unknown as ConsentFlowTerms;

        const result = pruneDeletedUrisFromConsentTerms(terms, ['delete-uri']);

        expect(result.removedSharedUris).toBe(1);
        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual(['keep-uri']);
        expect(result.terms.read.credentials.categories.ID.shared).toEqual(['id-uri']);
    });

    it('returns a cloned terms object even when there is nothing to remove', () => {
        const terms = {
            read: {
                credentials: {
                    categories: {
                        Achievement: {
                            shared: ['keep-uri'],
                        },
                    },
                },
            },
        } as unknown as ConsentFlowTerms;

        const result = pruneDeletedUrisFromConsentTerms(terms, ['missing-uri']);

        expect(result.removedSharedUris).toBe(0);
        expect(result.terms).not.toBe(terms);
        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual(['keep-uri']);
    });
});

describe('deleteCredentialFromAllContracts', () => {
    const invalidateQueries = vi.fn();
    const deleteCredentialFromAllContractsRoute = vi.fn().mockResolvedValue({
        contractsUpdated: 1,
        removedSharedUris: 1,
    });

    const wallet = {
        invoke: {
            deleteCredentialFromAllContracts: deleteCredentialFromAllContractsRoute,
        },
    } as never;

    const queryClient = {
        invalidateQueries,
    } as unknown as QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        deleteCredentialFromAllContractsRoute.mockResolvedValue({
            contractsUpdated: 1,
            removedSharedUris: 1,
        });
    });

    it('calls the backend prune route with unique deleted URIs', async () => {
        const result = await deleteCredentialFromAllContracts({
            wallet,
            queryClient,
            deletedUris: ['shared-delete', 'shared-delete'],
        });

        expect(deleteCredentialFromAllContractsRoute).toHaveBeenCalledOnce();
        expect(deleteCredentialFromAllContractsRoute).toHaveBeenCalledWith(['shared-delete']);
        expect(result).toEqual({
            contractsUpdated: 1,
            removedSharedUris: 1,
        });
    });

    it('invalidates consent-flow caches after targeted prune', async () => {
        await deleteCredentialFromAllContracts({
            wallet,
            queryClient,
            deletedUris: ['shared-delete'],
        });

        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['useConsentedContracts'] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['useConsentFlowData'] });
        expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['useConsentFlowDataForDid'] });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['useConsentFlowDataForDidByCategory'],
        });
        expect(invalidateQueries).toHaveBeenCalledWith({
            queryKey: ['useResolvedConsentFlowDataForDid'],
        });
    });
});
