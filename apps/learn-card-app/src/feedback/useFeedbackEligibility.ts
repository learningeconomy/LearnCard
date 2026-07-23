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
 * Privacy half of the feedback gate: child profiles, minors (by DOB or
 * server-side `isMinor` preference), and users who disabled analytics
 * never see prompts — their answers couldn't be recorded anyway.
 *
 * Split out from `useFeedbackEligibility` so call sites that decide to
 * prompt *later* (e.g. inside a claim-success callback) can pair this
 * reactive privacy check with a call-time `canPromptForFeedback()`
 * governor check, avoiding stale governor state captured at render.
 */
export const useFeedbackPrivacyEligibility = (): boolean => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const { data: preferences, isLoading } = useGetPreferencesForDid();

    return useMemo(() => {
        if (isLoading) return false;
        if (profileType === 'child') return false;
        // Intentionally opt-out: an unset preference counts as eligible.
        // Minors are covered by the explicit isMinor/DOB checks below.
        if (preferences?.analyticsEnabled === false) return false;
        if (preferences?.isMinor === true) return false;

        const dob = currentLCNUser?.dob;
        if (dob) {
            const age = calculateAge(dob);
            if (isNaN(age)) return false;
            if (age < getMinorAgeThreshold(currentLCNUser?.country)) return false;
        }

        return true;
    }, [
        isLoading,
        profileType,
        preferences?.analyticsEnabled,
        preferences?.isMinor,
        currentLCNUser?.dob,
        currentLCNUser?.country,
    ]);
};

/**
 * Whether a feedback prompt may render on this surface right now.
 * Combines the privacy gate with the frequency governor. The governor
 * check runs at render time — for deferred prompting (callbacks), use
 * `useFeedbackPrivacyEligibility` + `canPromptForFeedback` at call time.
 */
export const useFeedbackEligibility = (surface: FeedbackSurface): boolean => {
    const privacyEligible = useFeedbackPrivacyEligibility();

    return privacyEligible && canPromptForFeedback(surface);
};

export default useFeedbackEligibility;
