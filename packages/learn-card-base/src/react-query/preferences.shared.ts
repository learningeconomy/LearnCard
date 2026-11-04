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

export interface PreferenceResponseSession {
    identityKey: string;
    wallet: object;
}

// Provenance is deliberately not persisted. Optimistic/display cache writes
// must not turn a hydrated opt-in into server-authorized consent.
const resolvedPreferenceResponses = new WeakMap<
    PreferencesType,
    PreferenceResponseSession | null
>();

export const resolvePreferenceResponse = (
    preferences: PreferencesType,
    session: PreferenceResponseSession | null = null
): PreferencesType => {
    resolvedPreferenceResponses.set(preferences, session);
    return preferences;
};

export const isResolvedPreferenceResponse = (
    preferences: PreferencesType | undefined,
    session?: PreferenceResponseSession | null
): preferences is PreferencesType => {
    if (!preferences || !resolvedPreferenceResponses.has(preferences)) return false;
    if (session === undefined) return true;
    const owner = resolvedPreferenceResponses.get(preferences);
    return Boolean(
        owner &&
        session &&
        owner.wallet === session.wallet &&
        owner.identityKey === session.identityKey
    );
};

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
        resolvedPreferenceResponses.set(
            merged,
            resolvedPreferenceResponses.get(currentPreferences) ?? null
        );
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
