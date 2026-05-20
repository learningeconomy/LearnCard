import { useCallback, useRef } from 'react';
import { useAnalytics, AnalyticsEvents, ProfileBuildMethod, useProfileSnapshot } from '@analytics';

const SESSION_START_KEY = 'lc_session_start_ms';
const ACCOUNT_CREATED_AT_KEY = 'lc_account_created_at_ms';

/**
 * Shared helper for firing profile_item_added with SkillsProfileData method.
 * Used by SkillProfileSteps 1-4.
 */
export const useTrackProfileDataAdded = () => {
    const { track } = useAnalytics();
    const profileSnapshot = useProfileSnapshot();
    const profileSnapshotRef = useRef(profileSnapshot);
    profileSnapshotRef.current = profileSnapshot;

    const trackProfileDataAdded = useCallback(() => {
        const now = Date.now();
        const sessionStart = Number(localStorage.getItem(SESSION_START_KEY) ?? now);
        const accountCreatedAt = Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? now);
        track(AnalyticsEvents.PROFILE_ITEM_ADDED, {
            method: ProfileBuildMethod.SkillsProfileData,
            itemType: 'profile_data',
            itemCount: 1,
            totalItemsAfter: profileSnapshotRef.current.credentialCount + 1,
            msSinceAccountCreated: now - accountCreatedAt,
            msSinceSessionStart: now - sessionStart,
        });
    }, [track]);

    return { trackProfileDataAdded };
};
