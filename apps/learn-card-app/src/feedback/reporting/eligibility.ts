import { useMemo } from 'react';

import {
    calculateAge,
    getMinorAgeThreshold,
    switchedProfileStore,
    useGetCurrentLCNUser,
    useGetPreferencesForDid,
} from 'learn-card-base';

import type { PreferencesType } from 'learn-card-base';

/** Inputs consumed by the pure reporting-eligibility gate. */
export interface FeedbackReportingEligibilityInput {
    /** Whether a current LCN profile is authenticated. Missing/false fails closed. */
    hasAuthenticatedProfile?: boolean;
    /** Whether the preferences query is still loading. Fails closed when true. */
    isLoading?: boolean;
    /** Server-side privacy preferences; absent flags count as opted in. */
    preferences?: PreferencesType | null;
    /** Active switched-profile type; child profiles are never eligible. */
    profileType?: string | null;
    /** ISO date of birth from the current LCN profile, when present. */
    dob?: string | null;
    /** ISO 3166-1 country code used for the minor-age threshold. */
    country?: string | null;
    /** Injectable clock for deterministic tests. */
    now?: Date;
}

/** Per-destination reporting eligibility. */
export interface FeedbackReportingEligibility {
    /** Whether bug reports (Sentry) may be captured and submitted. */
    bug: boolean;
    /** Whether ideas (PostHog) may be submitted. */
    idea: boolean;
    isLoading: boolean;
}

const isAdultByDob = (
    dob: string | null | undefined,
    country: string | null | undefined,
    now: Date
): boolean => {
    // Absent DOB preserves the existing adult-profile default-enabled behavior.
    if (!dob) return true;

    // calculateAge returns NaN for invalid or future dates — fail closed.
    const age = calculateAge(dob, now);
    if (Number.isNaN(age)) return false;

    return age >= getMinorAgeThreshold(country ?? undefined);
};

/**
 * Privacy gate for the LC-2086 feedback reporting flow, separate from
 * `useFeedbackEligibility` (governed micro-prompts).
 *
 * Both destinations are disabled while preferences are loading, for child
 * profiles, when `preferences.isMinor === true`, or when a valid DOB places
 * the user below the country-specific minor threshold. An invalid DOB fails
 * closed; an absent DOB preserves the existing default-enabled behavior.
 *
 * After the shared age/profile gate:
 * - `bug` requires `preferences.bugReportsEnabled !== false`.
 * - `idea` requires `preferences.analyticsEnabled !== false`.
 */
export const getFeedbackReportingEligibility = ({
    hasAuthenticatedProfile,
    isLoading = false,
    preferences,
    profileType,
    dob,
    country,
    now = new Date(),
}: FeedbackReportingEligibilityInput): FeedbackReportingEligibility => {
    if (!hasAuthenticatedProfile) return { bug: false, idea: false, isLoading };

    if (isLoading) return { bug: false, idea: false, isLoading: true };

    const passesSharedGate =
        profileType !== 'child' && preferences?.isMinor !== true && isAdultByDob(dob, country, now);

    if (!passesSharedGate) return { bug: false, idea: false, isLoading: false };

    return {
        bug: preferences?.bugReportsEnabled !== false,
        idea: preferences?.analyticsEnabled !== false,
        isLoading: false,
    };
};

/**
 * Reactive adapter over the pure gate. Only maps current React-query/profile
 * data into `getFeedbackReportingEligibility` — it never consults the
 * micro-feedback frequency governor (`canPromptForFeedback`) and never
 * mutates preferences.
 */
export const useFeedbackReportingEligibility = (): FeedbackReportingEligibility => {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const { data: preferences, isLoading } = useGetPreferencesForDid();

    return useMemo(
        () =>
            getFeedbackReportingEligibility({
                hasAuthenticatedProfile: Boolean(currentLCNUser),
                isLoading,
                preferences,
                profileType,
                dob: currentLCNUser?.dob,
                country: currentLCNUser?.country,
            }),
        [currentLCNUser, isLoading, preferences, profileType]
    );
};
