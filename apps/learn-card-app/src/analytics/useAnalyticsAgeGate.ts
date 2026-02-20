import { useEffect } from 'react';

import { useGetCurrentLCNUser, switchedProfileStore, calculateAge } from 'learn-card-base';

import { useAnalytics } from './context';

const MINIMUM_AGE = 18;

/**
 * Disables analytics for users who are under 18 or who are in a child profile.
 *
 * This is a lightweight gate for LC-1534. LC-1594 will replace this with a
 * full user-preferences-backed system; this hook provides coverage in the meantime.
 *
 * Logic:
 * - If profileType === 'child' → disable (no DOB needed)
 * - If DOB is present and age < 18 → disable
 * - If DOB is absent (older accounts) → no-op (safe fallback, matches original behavior)
 * - If age >= 18 → ensure enabled
 */
export function useAnalyticsAgeGate() {
    const { currentLCNUser } = useGetCurrentLCNUser();
    const profileType = switchedProfileStore.use.profileType();
    const { setEnabled } = useAnalytics();

    useEffect(() => {
        const isChildProfile = profileType === 'child';

        if (isChildProfile) {
            setEnabled(false);
            return;
        }

        const dob = currentLCNUser?.dob;

        if (!dob) {
            // No DOB on record — safe fallback, leave analytics as-is
            return;
        }

        const age = calculateAge(dob);

        if (isNaN(age)) {
            // Unparseable DOB — safe fallback
            return;
        }

        setEnabled(age >= MINIMUM_AGE);
    }, [currentLCNUser?.dob, profileType, setEnabled]);
}

export default useAnalyticsAgeGate;
