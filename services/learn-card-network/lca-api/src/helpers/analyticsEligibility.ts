import { calculateAgeFromISODate, getMinorAgeThreshold } from '@learncard/helpers';

export type TrustedProfileAge = {
    dob?: string | null;
    country?: string | null;
    type?: string | null;
};

/** Missing DOB preserves legacy adult eligibility; malformed/future DOB fails closed. */
export const isAnalyticsRestricted = (profile: TrustedProfileAge, now = new Date()): boolean => {
    if (profile.type === 'child') return true;
    if (!profile.dob) return false;
    const age = calculateAgeFromISODate(profile.dob, now);
    return Number.isNaN(age) || age < getMinorAgeThreshold(profile.country ?? undefined);
};
