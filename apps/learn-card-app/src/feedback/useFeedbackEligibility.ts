import { useMemo } from 'react';

import {
    useGetCurrentLCNUser,
    useGetPreferencesForDid,
    switchedProfileStore,
    calculateAge,
} from 'learn-card-base';
import { getMinorAgeThreshold } from 'learn-card-base/constants/gdprAgeLimits';

import type { FeedbackSurface } from '@analytics';
import { canPromptForFeedback } from './feedbackGovernor';

/**
 * Whether a feedback prompt may render on this surface right now.
 * Combines the privacy gate (child profiles and minors never see
 * prompts; users who disabled analytics never see prompts — their
 * answers couldn't be recorded anyway) with the frequency governor.
 */
export const useFeedbackEligibility = (surface: FeedbackSurface): boolean => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const { data: preferences, isLoading } = useGetPreferencesForDid();

    return useMemo(() => {
        if (isLoading) return false;
        if (profileType === 'child') return false;
        if (preferences?.analyticsEnabled === false) return false;

        const dob = currentLCNUser?.dob;
        if (dob) {
            const age = calculateAge(dob);
            if (isNaN(age)) return false;
            if (age < getMinorAgeThreshold(currentLCNUser?.country)) return false;
        }

        return canPromptForFeedback(surface);
    }, [
        isLoading,
        profileType,
        preferences?.analyticsEnabled,
        currentLCNUser?.dob,
        currentLCNUser?.country,
        surface,
    ]);
};

export default useFeedbackEligibility;
