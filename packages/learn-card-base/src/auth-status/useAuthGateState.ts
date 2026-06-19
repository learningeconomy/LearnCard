import { useMemo } from 'react';

import { useOptionalAuthCoordinator } from '../auth-coordinator/AuthCoordinatorProvider';
import { walletStore } from '../stores/walletStore';
import { useIsLoggedIn } from '../stores/currentUserStore';
import { getLogger } from '../logging/logger';

import {
    deriveAuthStatus,
    shouldPromptProfileOnboarding,
    type AuthGateState,
    type CoordinatorStatus,
} from './authStatus';

const log = getLogger('auth-status');

/**
 * Derive a coordinator status even when the AuthCoordinatorProvider isn't mounted
 * (e.g. isolated tests, or legacy trees). Falls back to the persisted-login +
 * wallet signals, biased toward the SAFE `resolving`/`idle` states so the absence
 * of a coordinator can never fabricate a `ready` that authorizes onboarding.
 */
const resolveCoordinatorStatus = (
    contextStatus: CoordinatorStatus | undefined,
    walletReady: boolean,
    isLoggedIn: boolean
): CoordinatorStatus => {
    if (contextStatus) return contextStatus;
    if (walletReady) return 'ready';
    if (isLoggedIn) return 'deriving_key';
    return 'idle';
};

/**
 * Core wiring for the canonical auth-gate state. Takes the own-profile query's
 * status as arguments (rather than importing the query hook) so it can be reused
 * by both `useAuthStatus` and `useIsCurrentUserLCNUser` without a module cycle.
 */
export const useAuthGateState = (
    profileQueryStatus: 'pending' | 'error' | 'success',
    hasProfile: boolean
): AuthGateState => {
    const coordinator = useOptionalAuthCoordinator();
    const wallet = walletStore.use.wallet();
    const isLoggedIn = useIsLoggedIn();

    const walletReady = !!wallet;
    const coordinatorStatus = resolveCoordinatorStatus(
        coordinator?.state.status,
        walletReady,
        isLoggedIn
    );

    return useMemo(() => {
        const state = deriveAuthStatus({
            coordinatorStatus,
            walletReady,
            profileQueryStatus,
            hasProfile,
        });

        // Dev/staging contradiction tripwire: onboarding may be authorized ONLY
        // from a fully-settled wallet. If this ever fires, the race has regressed.
        if (
            process.env.NODE_ENV !== 'production' &&
            shouldPromptProfileOnboarding(state) &&
            !walletReady
        ) {
            log.error('auth-status.invariant_violation', {
                coordinatorStatus,
                walletReady,
                profileQueryStatus,
            });
        }

        return state;
    }, [coordinatorStatus, walletReady, profileQueryStatus, hasProfile]);
};

export default useAuthGateState;
