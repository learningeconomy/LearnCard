import { useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';

import { useWallet } from '../../hooks/useWallet';
import type { BespokeLearnCard } from '../../types/learn-card';
import {
    PREFERENCES_QUERY_KEY,
    optimisticallyMergePreferenceQueries,
    restorePreferenceQueries,
} from '../preferences.shared';
import type { PreferencesQuerySnapshot, PreferencesType } from '../preferences.shared';

export enum ThemeEnum {
    Colorful = 'colorful',
    Formal = 'formal',
}

export type { PreferencesType } from '../preferences.shared';

type PreferencesMutationContext = {
    previousPreferenceQueries: PreferencesQuerySnapshot;
};

// Bind the wallet when the caller starts the mutation, not after asynchronous
// optimistic updates: switching accounts must never redirect an in-flight write.
const requestedWallet = Symbol('preferences-wallet');
type PreferenceWrite = PreferencesType & {
    [requestedWallet]?: Promise<BespokeLearnCard>;
};

const bindPreferenceWrite = (
    preferences: PreferencesType,
    pendingWallet: Promise<BespokeLearnCard>
): PreferenceWrite => {
    // A global mutation hook may reject before onMutate attaches. Observe the
    // bound promise now; awaiting the original still propagates its failure.
    void pendingWallet.catch(() => undefined);
    return { ...preferences, [requestedWallet]: pendingWallet };
};

const usePreferencesMutation = (
    operation: 'create' | 'update'
): UseMutationResult<boolean, Error, PreferencesType, PreferencesMutationContext> => {
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    useEffect(() => {
        initWalletRef.current = initWallet;
    }, [initWallet]);
    const queryClient = useQueryClient();
    const mutation = useMutation<boolean, Error, PreferenceWrite, PreferencesMutationContext>({
        mutationFn: async request => {
            const { [requestedWallet]: pendingWallet, ...preferences } = request;
            const wallet = await pendingWallet!;
            const result =
                operation === 'create'
                    ? await wallet.invoke.createPreferences(preferences)
                    : await wallet.invoke.updatePreferences(preferences);
            return result;
        },
        onMutate: async request => {
            const { [requestedWallet]: pendingWallet, ...preferences } = request;
            const wallet = await pendingWallet!;
            const did = wallet.id.did();
            await queryClient.cancelQueries({ queryKey: [...PREFERENCES_QUERY_KEY, did] });
            // Opt-out applies immediately; opt-in waits for backend authorization.
            if (preferences.analyticsEnabled === true) delete preferences.analyticsEnabled;
            delete preferences.isMinor;
            delete preferences.analyticsAutoDisabled;
            return {
                previousPreferenceQueries: optimisticallyMergePreferenceQueries(
                    queryClient,
                    preferences,
                    did
                ),
            };
        },
        onError: (_error, _preferences, context) => {
            if (context) restorePreferenceQueries(queryClient, context.previousPreferenceQueries);
        },
        onSettled: () => {
            return queryClient.invalidateQueries({ queryKey: PREFERENCES_QUERY_KEY });
        },
    });

    const mutate = useCallback(
        (preferences: PreferencesType, options?: Parameters<typeof mutation.mutate>[1]) =>
            mutation.mutate(bindPreferenceWrite(preferences, initWalletRef.current()), options),
        [mutation.mutate]
    );
    const mutateAsync = useCallback(
        (preferences: PreferencesType, options?: Parameters<typeof mutation.mutateAsync>[1]) =>
            mutation.mutateAsync(
                bindPreferenceWrite(preferences, initWalletRef.current()),
                options
            ),
        [mutation.mutateAsync]
    );

    return { ...mutation, mutate, mutateAsync };
};

export const useUpdatePreferences = () => usePreferencesMutation('update');

export const useCreatePreferences = () => usePreferencesMutation('create');
