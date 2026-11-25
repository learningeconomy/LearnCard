import { useEffect } from 'react';

import type { UnifiedAuthState } from './types';

interface IdleAuthCleanupOptions {
    status: UnifiedAuthState['status'];
    hasEndedAuthSession: boolean;
    hasStoredAuthUser: boolean;
    hasLiveAuthUser: () => boolean;
    clearCachedAccount: () => void;
    clearAccountQueries: () => void;
}

/** Clear stale account state without treating anonymous/seeded startup as sign-out. */
export const useIdleAuthCleanup = ({
    status,
    hasEndedAuthSession,
    hasStoredAuthUser,
    hasLiveAuthUser,
    clearCachedAccount,
    clearAccountQueries,
}: IdleAuthCleanupOptions): void => {
    useEffect(() => {
        if (status !== 'idle' || (!hasEndedAuthSession && !hasStoredAuthUser)) return;

        // Retain the legacy startup grace and recheck live auth: a new login
        // must not be cleared by an earlier tab's delayed cleanup.
        const timer = setTimeout(() => {
            if (hasLiveAuthUser()) return;
            clearCachedAccount();
            // Idle also describes public pages and seed-based startup. Clearing
            // their active query observers can leave a successful fetch stuck
            // on its loading UI. Only confirmed session loss clears queries.
            if (hasEndedAuthSession) clearAccountQueries();
        }, 1500);

        return () => clearTimeout(timer);
    }, [
        status,
        hasEndedAuthSession,
        hasStoredAuthUser,
        hasLiveAuthUser,
        clearCachedAccount,
        clearAccountQueries,
    ]);
};
