import { QueryClient } from '@tanstack/react-query';

export type PreferencesType = {
    theme?: string;
    aiEnabled?: boolean;
    aiAutoDisabled?: boolean;
    analyticsEnabled?: boolean;
    analyticsAutoDisabled?: boolean;
    bugReportsEnabled?: boolean;
    isMinor?: boolean;
};

export const PREFERENCES_QUERY_KEY = ['useGetPreferencesForDid'] as const;

export type PreferencesQuerySnapshot = Array<[ReadonlyArray<unknown>, PreferencesType | undefined]>;

const mergePreferences = (
    currentPreferences: PreferencesType | undefined,
    nextPreferences: PreferencesType
): PreferencesType => ({
    ...(currentPreferences ?? {}),
    ...nextPreferences,
});

export const optimisticallyMergePreferenceQueries = (
    queryClient: QueryClient,
    nextPreferences: PreferencesType
): PreferencesQuerySnapshot => {
    const previousPreferenceQueries = queryClient.getQueriesData<PreferencesType>({
        queryKey: PREFERENCES_QUERY_KEY,
    });

    queryClient.setQueriesData<PreferencesType>(
        { queryKey: PREFERENCES_QUERY_KEY },
        currentPreferences => mergePreferences(currentPreferences, nextPreferences)
    );

    return previousPreferenceQueries;
};

export const restorePreferenceQueries = (
    queryClient: QueryClient,
    previousPreferenceQueries: PreferencesQuerySnapshot
): void => {
    previousPreferenceQueries.forEach(([queryKey, preferences]) => {
        queryClient.setQueryData(queryKey, preferences);
    });
};
