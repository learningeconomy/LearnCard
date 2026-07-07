import { describe, expect, it } from 'vitest';

import {
    deriveAuthStatus,
    shouldPromptProfileOnboarding,
    isProfileResolved,
    isAuthSettled,
    hasNetworkProfile,
    isAuthResolving,
    type AuthStatusInput,
    type CoordinatorStatus,
} from './authStatus';

const ALL_COORDINATOR_STATUSES: CoordinatorStatus[] = [
    'idle',
    'authenticating',
    'authenticated',
    'checking_key_status',
    'needs_setup',
    'needs_migration',
    'needs_recovery',
    'deriving_key',
    'ready',
    'error',
];

const ALL_QUERY_STATUSES: AuthStatusInput['profileQueryStatus'][] = ['pending', 'error', 'success'];

const ALL_WALLET_MODES: AuthStatusInput['walletMode'][] = ['full', 'offline', null];

const everyInput = (): AuthStatusInput[] => {
    const inputs: AuthStatusInput[] = [];

    for (const coordinatorStatus of ALL_COORDINATOR_STATUSES) {
        for (const walletReady of [true, false]) {
            for (const profileQueryStatus of ALL_QUERY_STATUSES) {
                for (const hasProfile of [true, false]) {
                    for (const isOffline of [true, false]) {
                        for (const walletMode of ALL_WALLET_MODES) {
                            inputs.push({
                                coordinatorStatus,
                                walletReady,
                                profileQueryStatus,
                                hasProfile,
                                isOffline,
                                walletMode,
                            });
                        }
                    }
                }
            }
        }
    }

    return inputs;
};

describe('deriveAuthStatus — onboarding invariant (exhaustive)', () => {
    it('authorizes onboarding ONLY when ready + wallet bridged + profile fetched + truly absent', () => {
        for (const input of everyInput()) {
            const onboarding = shouldPromptProfileOnboarding(deriveAuthStatus(input));

            const shouldBeAllowed =
                input.coordinatorStatus === 'ready' &&
                input.walletReady === true &&
                input.profileQueryStatus === 'success' &&
                input.hasProfile === false &&
                input.isOffline === false &&
                input.walletMode === 'full';

            expect(onboarding, JSON.stringify(input)).toBe(shouldBeAllowed);
        }
    });

    it('never authorizes onboarding while the wallet is not yet bridged', () => {
        for (const input of everyInput().filter(i => !i.walletReady)) {
            expect(
                shouldPromptProfileOnboarding(deriveAuthStatus(input)),
                JSON.stringify(input)
            ).toBe(false);
        }
    });

    it("never authorizes onboarding on a profile fetch error (couldn't determine ≠ absent)", () => {
        for (const input of everyInput().filter(i => i.profileQueryStatus === 'error')) {
            expect(
                shouldPromptProfileOnboarding(deriveAuthStatus(input)),
                JSON.stringify(input)
            ).toBe(false);
        }
    });

    it('never authorizes onboarding while a non-ready coordinator status is in flight', () => {
        const nonReady = everyInput().filter(i => i.coordinatorStatus !== 'ready');

        for (const input of nonReady) {
            expect(
                shouldPromptProfileOnboarding(deriveAuthStatus(input)),
                JSON.stringify(input)
            ).toBe(false);
        }
    });
});

describe('deriveAuthStatus — state mapping', () => {
    const base = {
        walletReady: true,
        profileQueryStatus: 'success',
        hasProfile: true,
        isOffline: false,
        walletMode: 'full',
    } as const;

    it('maps idle → unauthenticated', () => {
        expect(deriveAuthStatus({ ...base, coordinatorStatus: 'idle' })).toEqual({
            tag: 'unauthenticated',
        });
    });

    it('maps needs_setup → needs_setup', () => {
        expect(deriveAuthStatus({ ...base, coordinatorStatus: 'needs_setup' })).toEqual({
            tag: 'needs_setup',
        });
    });

    it('maps recovery / migration → recovering', () => {
        expect(deriveAuthStatus({ ...base, coordinatorStatus: 'needs_recovery' })).toEqual({
            tag: 'recovering',
        });
        expect(deriveAuthStatus({ ...base, coordinatorStatus: 'needs_migration' })).toEqual({
            tag: 'recovering',
        });
    });

    it('maps in-flight and error coordinator statuses → resolving', () => {
        for (const status of [
            'authenticating',
            'authenticated',
            'checking_key_status',
            'deriving_key',
            'error',
        ] as CoordinatorStatus[]) {
            expect(deriveAuthStatus({ ...base, coordinatorStatus: status })).toEqual({
                tag: 'resolving',
            });
        }
    });

    it('maps ready-but-wallet-not-bridged → resolving regardless of query state', () => {
        for (const input of everyInput().filter(
            i => i.coordinatorStatus === 'ready' && !i.walletReady
        )) {
            expect(deriveAuthStatus(input)).toEqual({ tag: 'resolving' });
        }
    });

    it('maps ready + wallet + query states → matching profile resolution', () => {
        expect(
            deriveAuthStatus({
                coordinatorStatus: 'ready',
                walletReady: true,
                profileQueryStatus: 'pending',
                hasProfile: false,
                isOffline: false,
                walletMode: 'full',
            })
        ).toEqual({ tag: 'ready', profile: { tag: 'loading' } });

        expect(
            deriveAuthStatus({
                coordinatorStatus: 'ready',
                walletReady: true,
                profileQueryStatus: 'error',
                hasProfile: false,
                isOffline: false,
                walletMode: 'full',
            })
        ).toEqual({ tag: 'ready', profile: { tag: 'error' } });

        expect(
            deriveAuthStatus({
                coordinatorStatus: 'ready',
                walletReady: true,
                profileQueryStatus: 'success',
                hasProfile: true,
                isOffline: false,
                walletMode: 'full',
            })
        ).toEqual({ tag: 'ready', profile: { tag: 'present' } });

        expect(
            deriveAuthStatus({
                coordinatorStatus: 'ready',
                walletReady: true,
                profileQueryStatus: 'success',
                hasProfile: false,
                isOffline: false,
                walletMode: 'full',
            })
        ).toEqual({ tag: 'ready', profile: { tag: 'absent' } });
    });

    it('maps ready + wallet + success + no-profile while offline → unconfirmed (never absent)', () => {
        expect(
            deriveAuthStatus({
                coordinatorStatus: 'ready',
                walletReady: true,
                profileQueryStatus: 'success',
                hasProfile: false,
                isOffline: true,
                walletMode: 'full',
            })
        ).toEqual({ tag: 'ready', profile: { tag: 'unconfirmed' } });
    });

    it('maps ready + wallet + success + no-profile on the offline-fallback wallet → unconfirmed', () => {
        for (const walletMode of ['offline', null] as const) {
            expect(
                deriveAuthStatus({
                    coordinatorStatus: 'ready',
                    walletReady: true,
                    profileQueryStatus: 'success',
                    hasProfile: false,
                    isOffline: false,
                    walletMode,
                })
            ).toEqual({ tag: 'ready', profile: { tag: 'unconfirmed' } });
        }
    });
});

describe('predicates', () => {
    it('hasNetworkProfile is true only for ready + present', () => {
        for (const input of everyInput()) {
            const expected =
                input.coordinatorStatus === 'ready' &&
                input.walletReady &&
                input.profileQueryStatus === 'success' &&
                input.hasProfile;

            expect(hasNetworkProfile(deriveAuthStatus(input)), JSON.stringify(input)).toBe(
                expected
            );
        }
    });

    it('isProfileResolved is true only for ready + (present | absent), never unconfirmed', () => {
        for (const input of everyInput()) {
            // A no-profile success is only "resolved" (absent) when online on a
            // full networked wallet; otherwise it's unconfirmed (NOT resolved).
            const expected =
                input.coordinatorStatus === 'ready' &&
                input.walletReady &&
                input.profileQueryStatus === 'success' &&
                (input.hasProfile || (!input.isOffline && input.walletMode === 'full'));

            expect(isProfileResolved(deriveAuthStatus(input)), JSON.stringify(input)).toBe(
                expected
            );
        }
    });

    it('never authorizes onboarding while offline', () => {
        for (const input of everyInput().filter(i => i.isOffline)) {
            expect(
                shouldPromptProfileOnboarding(deriveAuthStatus(input)),
                JSON.stringify(input)
            ).toBe(false);
        }
    });

    it('never authorizes onboarding on the offline-fallback wallet (mode !== full)', () => {
        for (const input of everyInput().filter(i => i.walletMode !== 'full')) {
            expect(
                shouldPromptProfileOnboarding(deriveAuthStatus(input)),
                JSON.stringify(input)
            ).toBe(false);
        }
    });

    it('isAuthSettled is true for resolved profiles AND unauthenticated (never leaves logged-out loading)', () => {
        for (const input of everyInput()) {
            const isUnauthenticated = input.coordinatorStatus === 'idle';
            const isResolved =
                input.coordinatorStatus === 'ready' &&
                input.walletReady &&
                input.profileQueryStatus === 'success';

            expect(isAuthSettled(deriveAuthStatus(input)), JSON.stringify(input)).toBe(
                isUnauthenticated || isResolved
            );
        }
    });

    it('isAuthResolving and shouldPromptProfileOnboarding are mutually exclusive', () => {
        for (const input of everyInput()) {
            const state = deriveAuthStatus(input);
            expect(isAuthResolving(state) && shouldPromptProfileOnboarding(state)).toBe(false);
        }
    });
});
