import { useCallback } from 'react';
import {
    useAnalytics,
    AnalyticsEvents,
    ProfileBuildMethod,
    ACCOUNT_CREATED_AT_KEY,
    SESSION_START_KEY,
    PROFILE_DATA_COUNT_KEY,
} from '@analytics';

/**
 * Shared helper for firing `profile_item_added` with `SkillsProfileData` method.
 * Used by Skills Profile Steps 1-4 (each step fires once on save).
 *
 * `totalItemsAfter` for `profile_data` items uses a localStorage running
 * counter rather than `credentialCount`/`skillsCount`, since neither is the
 * right semantic counter for profile metadata (the original implementation
 * incorrectly reported `credentialCount + 1`).
 */
export const useTrackProfileDataAdded = () => {
    const { track } = useAnalytics();

    const trackProfileDataAdded = useCallback(() => {
        const now = Date.now();
        const sessionStart = Number(localStorage.getItem(SESSION_START_KEY) ?? now);
        const accountCreatedAt = Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? now);
        const priorCount = Number(localStorage.getItem(PROFILE_DATA_COUNT_KEY) ?? 0);
        const totalItemsAfter = priorCount + 1;
        localStorage.setItem(PROFILE_DATA_COUNT_KEY, String(totalItemsAfter));

        track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
            method: ProfileBuildMethod.SkillsProfileData,
            itemType: 'profile_data',
            itemCount: 1,
            totalItemsAfter,
            msSinceAccountCreated: now - accountCreatedAt,
            msSinceSessionStart: now - sessionStart,
        });
    }, [track]);

    return { trackProfileDataAdded };
};
