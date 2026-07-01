import type { UnifiedAuthState } from '../auth-coordinator/types';

/**
 * Canonical, race-safe model of "where is the user in the auth/profile lifecycle".
 *
 * This exists to make one bug class UNREPRESENTABLE: gating decisions (onboarding,
 * age gate, network-join prompts) must never confuse "still resolving" or "couldn't
 * determine" with "genuinely has no profile". Those three are distinct tags here,
 * so a consumer that switches on this union cannot collapse them into `!data`.
 *
 * `deriveAuthStatus` is a PURE function of primitive inputs so it can be tested
 * exhaustively over the full input cross-product (see authStatus.test.ts).
 */

export type CoordinatorStatus = UnifiedAuthState['status'];

/** Outcome of fetching the current user's own LCN profile, once the wallet exists. */
export type ProfileResolution =
    | { tag: 'loading' }
    | { tag: 'error' }
    | { tag: 'absent' }
    | { tag: 'present' };

export type AuthGateState =
    | { tag: 'unauthenticated' }
    | { tag: 'resolving' }
    | { tag: 'recovering' }
    | { tag: 'needs_setup' }
    | { tag: 'ready'; profile: ProfileResolution };

export interface AuthStatusInput {
    coordinatorStatus: CoordinatorStatus;
    /** True once the reconstructed wallet has been bridged into walletStore. */
    walletReady: boolean;
    /** React Query status of the current user's own-profile query. */
    profileQueryStatus: 'pending' | 'error' | 'success';
    /** Whether that query resolved to an actual profile. */
    hasProfile: boolean;
}

/**
 * The single source of truth for auth-gate decisions. Pure and total.
 *
 * The load-bearing guarantee: a `{ tag: 'ready', profile: { tag: 'absent' } }`
 * result — the ONLY state in which onboarding prompts may fire — requires the
 * coordinator to be `ready`, the wallet to be bridged, AND the profile fetch to
 * have succeeded with no profile. The persisted-currentUser-without-key resume
 * window maps to `resolving`, which can never authorize onboarding.
 */
export const deriveAuthStatus = (input: AuthStatusInput): AuthGateState => {
    const { coordinatorStatus, walletReady, profileQueryStatus, hasProfile } = input;

    switch (coordinatorStatus) {
        case 'idle':
            return { tag: 'unauthenticated' };

        case 'needs_setup':
            return { tag: 'needs_setup' };

        case 'needs_recovery':
        case 'needs_migration':
            return { tag: 'recovering' };

        case 'authenticating':
        case 'authenticated':
        case 'checking_key_status':
        case 'deriving_key':
        // An errored coordinator is never "settled enough" to onboard against;
        // the provider's error overlay owns that UX.
        case 'error':
            return { tag: 'resolving' };

        case 'ready': {
            // Coordinator reached ready, but the wallet hasn't been bridged into
            // walletStore yet — the own-profile query can't be trusted.
            if (!walletReady) return { tag: 'resolving' };

            switch (profileQueryStatus) {
                case 'pending':
                    return { tag: 'ready', profile: { tag: 'loading' } };
                case 'error':
                    return { tag: 'ready', profile: { tag: 'error' } };
                case 'success':
                    return {
                        tag: 'ready',
                        profile: hasProfile ? { tag: 'present' } : { tag: 'absent' },
                    };
            }
        }
    }

    // Unreachable when CoordinatorStatus is exhaustive; defaults to the safe state.
    return { tag: 'resolving' };
};

/**
 * The ONLY sanctioned gate for "this user has no network profile, prompt them".
 * Requires a positive `absent` assertion — never the mere absence of data.
 */
export const shouldPromptProfileOnboarding = (state: AuthGateState): boolean =>
    state.tag === 'ready' && state.profile.tag === 'absent';

/** True once the profile question is definitively answered (present or absent). */
export const isProfileResolved = (state: AuthGateState): boolean =>
    state.tag === 'ready' && (state.profile.tag === 'present' || state.profile.tag === 'absent');

/**
 * True once the auth/profile question is settled enough to stop showing a loader:
 * either the profile is definitively resolved, or the user is definitively
 * unauthenticated (no profile to fetch). Consumers that key a spinner off
 * `isLoading` must use this — `isProfileResolved` alone leaves logged-out users
 * loading forever.
 */
export const isAuthSettled = (state: AuthGateState): boolean =>
    state.tag === 'unauthenticated' || isProfileResolved(state);

/** True while the user genuinely has a network profile. */
export const hasNetworkProfile = (state: AuthGateState): boolean =>
    state.tag === 'ready' && state.profile.tag === 'present';

/** True while anything auth/profile-related is still in flight — hold gate decisions. */
export const isAuthResolving = (state: AuthGateState): boolean =>
    state.tag === 'resolving' || (state.tag === 'ready' && state.profile.tag === 'loading');
