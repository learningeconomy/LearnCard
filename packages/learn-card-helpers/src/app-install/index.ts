/**
 * App installation age restriction logic shared between frontend and backend.
 *
 * This helper evaluates whether a user can install an app based on:
 * - Hard age blocks (min_age) - always blocks, even with guardian approval
 * - Soft age restrictions (age_rating) - can be approved by guardian for child profiles
 * - Contract requirements - require guardian approval for child profiles
 */

export type AppInstallCheckResult =
    | { action: 'proceed' }
    | { action: 'hard_blocked'; reason: string }
    | { action: 'require_dob'; reason: string }
    | { action: 'require_guardian_approval'; reason: string };

export type AppInstallCheckInput = {
    /** Whether the user is a child profile (managed account) */
    isChildProfile: boolean;
    /** User's age calculated from DOB, null if DOB is unknown */
    userAge: number | null;
    /** Hard minimum age requirement (blocks completely, no guardian override) */
    minAge?: number;
    /** Soft age rating string (e.g., '4+', '9+', '12+', '17+') */
    ageRating?: string;
    /** Whether the app has an associated consent contract */
    hasContract: boolean;
    /** Whether guardian approval has already been obtained (for backend validation) */
    hasGuardianApproval?: boolean;
};

/**
 * Evaluates whether a user can install an app based on age restrictions and profile type.
 *
 * Cases:
 * 1. Hard block: min_age violation (blocks completely, cannot be overridden)
 * 2. Child profile scenarios:
 *    2a. Child age unknown → require DOB entry (with guardian approval)
 *    2b. No age rating specified → require guardian approval
 *    2c. Child too young for age rating → require guardian approval
 *    2d. App has a contract → require guardian approval
 *    2e. Child old enough, no contract → proceed without guardian
 * 3. Adult user old enough → proceed
 *
 * @param input - The check parameters
 * @returns The action to take and reason if blocked/requires approval
 */
export const checkAppInstallEligibility = (input: AppInstallCheckInput): AppInstallCheckResult => {
    const {
        isChildProfile,
        userAge,
        minAge,
        ageRating,
        hasContract,
        hasGuardianApproval = false,
    } = input;

    const ageRatingMinAge = getAgeRatingMinAge(ageRating);

    // Case 1: Hard block - min_age violation (block completely)
    // Only applies when userAge is known
    const isHardBlocked =
        userAge !== null && minAge !== undefined && minAge > 0 && userAge < minAge;

    if (isHardBlocked) {
        return {
            action: 'hard_blocked',
            reason: `User does not meet the minimum age requirement of ${minAge}`,
        };
    }

    // Case 2: Child profile - check age restrictions
    if (isChildProfile) {
        const noAgeRating = ageRatingMinAge === 0;
        const childAgeUnknown = userAge === null;
        const childTooYoung = userAge !== null && userAge < ageRatingMinAge;

        // Case 2a: Child age unknown - require guardian to verify age via DOB entry
        // If guardian has already approved, allow proceed (DOB may not be saved yet)
        if (childAgeUnknown) {
            if (hasGuardianApproval) {
                return { action: 'proceed' };
            }
            return {
                action: 'require_dob',
                reason: 'Child profile age is unknown and must be verified by guardian',
            };
        }

        // Case 2b: No age rating specified - require guardian approval
        if (noAgeRating) {
            if (hasGuardianApproval) {
                return { action: 'proceed' };
            }
            return {
                action: 'require_guardian_approval',
                reason: 'App has no age rating; guardian approval required for child profiles',
            };
        }

        // Case 2c: Child too young for age rating - require guardian approval
        if (childTooYoung) {
            if (hasGuardianApproval) {
                return { action: 'proceed' };
            }
            return {
                action: 'require_guardian_approval',
                reason: `Child is under the age rating of ${ageRatingMinAge}+; guardian approval required`,
            };
        }

        // Case 2d: App with a contract - require guardian approval
        if (hasContract) {
            if (hasGuardianApproval) {
                return { action: 'proceed' };
            }
            return {
                action: 'require_guardian_approval',
                reason: 'App requires consent to a contract; guardian approval required for child profiles',
            };
        }

        // Case 2e: Child old enough, no contract - proceed directly without guardian approval
    }

    // Case 3: User is old enough (or adult) - proceed directly
    return { action: 'proceed' };
};

/**
 * Map age_rating strings to numeric minimum ages.
 */
export const AGE_RATING_TO_MIN_AGE: Record<string, number> = {
    '4+': 4,
    '9+': 9,
    '12+': 12,
    '17+': 17,
};

/**
 * Convert an age_rating string to a numeric minimum age.
 * Returns 0 if no rating is specified or the rating is unknown.
 */
const getAgeRatingMinAge = (ageRating?: string): number => {
    if (!ageRating) return 0;
    return AGE_RATING_TO_MIN_AGE[ageRating] ?? 0;
};

/**
 * Calculate age in years from a date of birth string.
 * @param dob - Date of birth as ISO string or parseable date string
 * @returns Age in years, or null if the date is invalid
 */
export const calculateAgeFromDob = (dob?: string | null): number | null => {
    if (!dob) return null;

    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
};
