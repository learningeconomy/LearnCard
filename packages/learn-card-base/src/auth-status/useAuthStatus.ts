import { useGetProfile } from '../react-query/queries/queries';

import { useAuthGateState } from './useAuthGateState';
import type { AuthGateState } from './authStatus';

/**
 * The canonical, race-safe auth-gate state for the current user.
 *
 * This is the ONLY hook that gating decisions (onboarding, age gate, network-join
 * prompts) should branch on. It composes the AuthCoordinator state machine, the
 * bridged wallet, and the own-profile query through the pure `deriveAuthStatus`
 * selector, so the persisted-currentUser-without-key resume window resolves to
 * `resolving` rather than a settled "logged in + no profile".
 */
export const useAuthStatus = (): AuthGateState => {
    const profileQuery = useGetProfile();

    return useAuthGateState(profileQuery.status, !!profileQuery.data);
};

export default useAuthStatus;
