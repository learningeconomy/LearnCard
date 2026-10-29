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

// Provenance is deliberately not persisted. Optimistic/display cache writes
// must not turn a hydrated opt-in into server-authorized consent.
const resolvedPreferenceResponses = new WeakSet<PreferencesType>();

export const resolvePreferenceResponse = (preferences: PreferencesType): PreferencesType => {
    resolvedPreferenceResponses.add(preferences);
    return preferences;
};

export const isResolvedPreferenceResponse = (preferences: PreferencesType | undefined): boolean =>
    Boolean(preferences && resolvedPreferenceResponses.has(preferences));

const mergePreferences = (
    currentPreferences: PreferencesType | undefined,
    nextPreferences: PreferencesType
): PreferencesType => {
    const merged = { ...currentPreferences, ...nextPreferences };
    // Preserve established authority for display-only updates, but never
    // manufacture it from hydrated data or a new optimistic opt-in.
    if (
        isResolvedPreferenceResponse(currentPreferences) &&
        nextPreferences.analyticsEnabled !== true
    ) {
        resolvedPreferenceResponses.add(merged);
    }
    return merged;
};

export const optimisticallyMergePreferenceQueries = (
    queryClient: QueryClient,
    nextPreferences: PreferencesType,
    did: string
): PreferencesQuerySnapshot => {
    const queryKey = [...PREFERENCES_QUERY_KEY, did];
    const previousPreferenceQueries = queryClient.getQueriesData<PreferencesType>({
        queryKey,
        exact: true,
    });

    queryClient.setQueriesData<PreferencesType>({ queryKey, exact: true }, currentPreferences =>
        mergePreferences(currentPreferences, nextPreferences)
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
