import { useAppAuth } from './AuthCoordinatorProvider';

type AuthStatus = ReturnType<typeof useAppAuth>['state']['status'];

/**
 * Auth states that render routes (see AppRouter's start-up gate). Every other state is a
 * transition: the user may turn out to be signed in, but the wallet and currentUserStore aren't
 * populated yet, so anything that depends on who is signed in must wait.
 */
const SETTLED_STATUSES: ReadonlySet<AuthStatus> = new Set<AuthStatus>([
    'idle', // genuinely signed out
    'needs_setup', // the login page can open onboarding
    'needs_recovery', // the coordinator overlays the recovery modal
    'error', // the coordinator overlays its error UI
]);

export const isAuthSettled = (status: AuthStatus, walletReady: boolean): boolean =>
    walletReady || SETTLED_STATUSES.has(status);

/** Whether the app knows yet who (if anyone) is signed in. */
export const useAuthSettled = (): boolean => {
    const { state, walletReady } = useAppAuth();
    return isAuthSettled(state.status, walletReady);
};
