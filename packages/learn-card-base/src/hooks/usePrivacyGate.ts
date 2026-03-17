import { useEffect, useRef } from 'react';

import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';
import { switchedProfileStore } from '../stores/walletStore';
import { calculateAge } from '../helpers/dateHelpers';
import { getMinorAgeThreshold } from '../constants/gdprAgeLimits';
import { useGetPreferencesForDid } from '../react-query/queries/preferences';
import { useUpdatePreferences } from '../react-query/mutations/preferences';

export type UsePrivacyGateOptions = {
    onAnalyticsChange?: (enabled: boolean) => void;
};

/**
 * Runs on login/profile load. Determines if the current user is a minor
 * (via DOB < 18 or child profile switch) and auto-initializes privacy
 * preferences on first run. Calls onAnalyticsChange whenever the stored
 * analyticsEnabled preference changes.
 */
export function usePrivacyGate({ onAnalyticsChange }: UsePrivacyGateOptions = {}) {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const { data: preferences } = useGetPreferencesForDid();
    const { mutate: updatePreferences } = useUpdatePreferences();

    // Ref to prevent re-running first-time setup on every render
    const hasInitialized = useRef(false);

    // Stable ref for the callback to avoid stale closure issues
    const onAnalyticsChangeRef = useRef(onAnalyticsChange);
    useEffect(() => {
        onAnalyticsChangeRef.current = onAnalyticsChange;
    });

    const isChildProfile = profileType === 'child';
    const dob = currentLCNUser?.dob;
    const age = dob ? calculateAge(dob) : null;
    const threshold = getMinorAgeThreshold(currentLCNUser?.country);
    const isMinor = isChildProfile || (age !== null && !isNaN(age) && age < threshold);

    // First-run: auto-set preferences when the privacy flags have never been written
    useEffect(() => {
        if (preferences === undefined) return;
        if (preferences.aiAutoDisabled !== undefined || preferences.analyticsAutoDisabled !== undefined) return;
        if (hasInitialized.current) return;

        hasInitialized.current = true;

        if (isMinor) {
            updatePreferences({
                aiEnabled: false,
                aiAutoDisabled: true,
                analyticsEnabled: false,
                analyticsAutoDisabled: true,
                bugReportsEnabled: false,
                isMinor: true,
            });
        } else {
            updatePreferences({
                aiEnabled: true,
                aiAutoDisabled: false,
                analyticsEnabled: true,
                analyticsAutoDisabled: false,
                bugReportsEnabled: true,
                isMinor: false,
            });
        }
    }, [preferences, isMinor]);

    // Notify analytics system whenever the stored preference changes,
    // always forcing off for child profiles regardless of stored value.
    useEffect(() => {
        if (isChildProfile) {
            onAnalyticsChangeRef.current?.(false);
            return;
        }
        if (preferences === undefined) return;
        const analyticsEnabled = preferences.analyticsEnabled ?? true;
        onAnalyticsChangeRef.current?.(analyticsEnabled);
    }, [preferences?.analyticsEnabled, isChildProfile]);

    return {
        isMinor,
        preferences,
    };
}

export default usePrivacyGate;
