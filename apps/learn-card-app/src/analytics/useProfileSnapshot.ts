import { useMemo } from 'react';
import { useGetCredentialCount } from 'learn-card-base';
import { useSkillsCount } from '../hooks/useSkillsCount';

import type { ProfileSnapshot } from './events';

const ACCOUNT_CREATED_AT_KEY = 'lc_account_created_at_ms';

/**
 * Returns a synchronous snapshot of the user's current profile state.
 *
 * **Critical for LC-1853:** Consumers MUST capture the returned value into a
 * ref *before* calling any mutation. Then compute `totalItemsAfter` as
 * `snapshotRef.current.credentialCount + 1` (arithmetic) — do NOT re-read
 * after mutation, because LearnCloud index may lag.
 */
export const useProfileSnapshot = (): ProfileSnapshot => {
    const { data: credentialCount } = useGetCredentialCount(undefined, true);
    const { total: skillsCount } = useSkillsCount();

    return useMemo(() => {
        const now = Date.now();
        const accountCreatedAt = Number(localStorage.getItem(ACCOUNT_CREATED_AT_KEY) ?? 0);

        return {
            credentialCount: Number(credentialCount ?? 0),
            hasSkillsProfile: skillsCount > 0,
            skillsCount: skillsCount ?? 0,
            daysSinceSignup: accountCreatedAt
                ? (now - accountCreatedAt) / 86_400_000
                : 0,
        };
    }, [credentialCount, skillsCount]);
};

/** The localStorage key used to store the account creation timestamp. */
export { ACCOUNT_CREATED_AT_KEY };
