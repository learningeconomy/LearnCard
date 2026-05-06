import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ConsentFlowTerms } from '@learncard/types';
import {
    pruneDeletedUrisFromConsentFlow,
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
        } as ConsentFlowTerms;

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
        } as ConsentFlowTerms;

        const result = pruneDeletedUrisFromConsentTerms(terms, ['missing-uri']);

        expect(result.removedSharedUris).toBe(0);
        expect(result.terms).not.toBe(terms);
        expect(result.terms.read.credentials.categories.Achievement.shared).toEqual(['keep-uri']);
    });
});

describe('pruneDeletedUrisFromConsentFlow', () => {
    const invalidateQueries = vi.fn();
    const pruneDeletedUrisFromConsentFlowRoute = vi.fn().mockResolvedValue({
        contractsUpdated: 1,
        removedSharedUris: 1,
    });

    const wallet = {
        invoke: {
            pruneDeletedUrisFromConsentFlow: pruneDeletedUrisFromConsentFlowRoute,
        },
    } as never;

    const queryClient = {
        invalidateQueries,
    } as unknown as QueryClient;

    beforeEach(() => {
        vi.clearAllMocks();
        pruneDeletedUrisFromConsentFlowRoute.mockResolvedValue({
            contractsUpdated: 1,
            removedSharedUris: 1,
        });
    });

    it('calls the backend prune route with unique deleted URIs', async () => {
        const result = await pruneDeletedUrisFromConsentFlow({
            wallet,
            queryClient,
            deletedUris: ['shared-delete', 'shared-delete'],
        });

        expect(pruneDeletedUrisFromConsentFlowRoute).toHaveBeenCalledOnce();
        expect(pruneDeletedUrisFromConsentFlowRoute).toHaveBeenCalledWith({
            deletedUris: ['shared-delete'],
        });
        expect(result).toEqual({
            contractsUpdated: 1,
            removedSharedUris: 1,
        });
    });

    it('invalidates consent-flow caches after targeted prune', async () => {
        await pruneDeletedUrisFromConsentFlow({
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
