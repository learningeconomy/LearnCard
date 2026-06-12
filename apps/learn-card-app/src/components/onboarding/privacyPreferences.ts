import { getMinorAgeThreshold } from 'learn-card-base/constants/gdprAgeLimits';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';

export type OnboardingPrivacyPreferences = {
    aiEnabled: boolean;
    aiAutoDisabled: boolean;
    analyticsEnabled: boolean;
    analyticsAutoDisabled: boolean;
    bugReportsEnabled: boolean;
    isMinor: boolean;
};

export const getDefaultPrivacyPreferences = (
    dob?: string | null,
    country?: string
): OnboardingPrivacyPreferences => {
    const age = dob ? calculateAge(dob) : Number.NaN;
    const threshold = getMinorAgeThreshold(country);
    const isMinor = !Number.isNaN(age) && age < threshold;

    return {
        aiEnabled: !isMinor,
        aiAutoDisabled: isMinor,
        analyticsEnabled: !isMinor,
        analyticsAutoDisabled: false,
        bugReportsEnabled: !isMinor,
        isMinor,
    };
};
