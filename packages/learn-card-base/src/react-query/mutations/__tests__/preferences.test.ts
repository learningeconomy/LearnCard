import { describe, expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';

import {
    optimisticallyMergePreferenceQueries,
    restorePreferenceQueries,
} from '../../preferences.shared';

describe('preferences cache helpers', () => {
    it('updates cached preferences immediately for every DID-scoped preferences query', () => {
        const queryClient = new QueryClient();
        const firstDidKey = ['useGetPreferencesForDid', 'did:example:one'];
        const secondDidKey = ['useGetPreferencesForDid', 'did:example:two'];
        const unrelatedKey = ['unrelated-query'];

        queryClient.setQueryData(firstDidKey, {
            aiEnabled: false,
            analyticsEnabled: true,
        });
        queryClient.setQueryData(secondDidKey, {
            aiEnabled: false,
            bugReportsEnabled: false,
        });
        queryClient.setQueryData(unrelatedKey, { aiEnabled: false });

        optimisticallyMergePreferenceQueries(queryClient, { aiEnabled: true });

        expect(queryClient.getQueryData(firstDidKey)).toEqual({
            aiEnabled: true,
            analyticsEnabled: true,
        });
        expect(queryClient.getQueryData(secondDidKey)).toEqual({
            aiEnabled: true,
            bugReportsEnabled: false,
        });
        expect(queryClient.getQueryData(unrelatedKey)).toEqual({ aiEnabled: false });
    });

    it('restores the previous cached values when an optimistic update needs to roll back', () => {
        const queryClient = new QueryClient();
        const preferencesKey = ['useGetPreferencesForDid', 'did:example:one'];

        queryClient.setQueryData(preferencesKey, {
            aiEnabled: false,
            analyticsEnabled: true,
        });

        const snapshot = optimisticallyMergePreferenceQueries(queryClient, {
            aiEnabled: true,
            bugReportsEnabled: true,
        });

        restorePreferenceQueries(queryClient, snapshot);

        expect(queryClient.getQueryData(preferencesKey)).toEqual({
            aiEnabled: false,
            analyticsEnabled: true,
        });
    });
});
