/**
 * Provider-level tests for the authProvider swap.
 *
 * On interactive login, authUser populates and the app swaps the noOp auth
 * provider for the real one. The provider recreates the coordinator; until
 * the new coordinator's async initialize() emits its first state, consumers
 * used to see the stale settled state ('idle') for a paint — flashing the
 * login screen between two loading screens. The provider must bridge that
 * window synchronously with 'authenticating'.
 *
 * @vitest-environment jsdom
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

import {
    AuthCoordinatorProvider,
    useAuthCoordinator,
    type AuthCoordinatorContextValue,
} from '../AuthCoordinatorProvider';

import type { AuthProvider, KeyDerivationStrategy } from '../types';

const createMockKeyDerivation = (): KeyDerivationStrategy =>
    ({
        name: 'mock',
        capabilities: { recovery: false },
        hasLocalKey: vi.fn().mockResolvedValue(false),
        fetchServerKeyStatus: vi.fn().mockResolvedValue({
            exists: false,
            needsMigration: false,
            recoveryMethods: [],
        }),
        deriveKey: vi.fn(),
        setupKey: vi.fn(),
        clearLocalKeys: vi.fn(),
    }) as unknown as KeyDerivationStrategy;

const StatusProbe: React.FC = () => {
    const { state } = useAuthCoordinator();
    return <div data-testid="status">{state.status}</div>;
};

// Real cached-key reads hit async platform storage (IndexedDB / secure
// storage) — a macrotask, not a microtask. That delay is the paint window
// where stale settled state used to flash, so the mock must model it.
const slowCachedKey = (value: string | null) => () =>
    new Promise<string | null>(resolve => setTimeout(() => resolve(value), 20));

describe('AuthCoordinatorProvider authProvider swap', () => {
    it('exposes activation-aware setup and publishes completion only after an activation retry succeeds', async () => {
        const keyDerivation = createMockKeyDerivation();
        keyDerivation.capabilities.recovery = true;
        keyDerivation.fetchServerKeyStatus = vi.fn().mockResolvedValue({
            exists: true,
            needsMigration: true,
            sssActivationState: 'provisional',
            recoveryMethods: [],
        });
        keyDerivation.activate = vi
            .fn()
            .mockRejectedValueOnce(new Error('offline'))
            .mockResolvedValue(undefined);
        const authProvider: AuthProvider = {
            getIdToken: vi.fn().mockResolvedValue('token'),
            getCurrentUser: vi.fn().mockResolvedValue({ id: 'user' }),
            getProviderType: () => 'firebase',
            signOut: vi.fn(),
        };
        let context!: AuthCoordinatorContextValue;
        const Probe = () => {
            const value = useAuthCoordinator();
            React.useEffect(() => {
                context = value;
            }, [value]);
            return null;
        };
        const getCachedPrivateKey = async () => 'private-key';
        const didFromPrivateKey = async () => 'did:key:test';
        const view = render(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={authProvider}
                getCachedPrivateKey={getCachedPrivateKey}
                didFromPrivateKey={didFromPrivateKey}
            >
                <Probe />
            </AuthCoordinatorProvider>
        );
        await waitFor(() => expect(context.needsActivation).toBe(true));
        const confirm = vi.fn().mockResolvedValue(undefined);
        await act(async () => {
            await expect(context.runRecoverySetup('phrase', confirm)).rejects.toThrow(
                'Please try again'
            );
        });
        expect(context.recoverySetupRevision).toBe(0);
        expect(context.needsActivation).toBe(true);
        const originalRun = context.runRecoverySetup;
        const originalReset = context.resetRecoverySetup;
        const refreshedProvider = { ...authProvider };
        view.rerender(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={refreshedProvider}
                getCachedPrivateKey={getCachedPrivateKey}
                didFromPrivateKey={didFromPrivateKey}
            >
                <Probe />
            </AuthCoordinatorProvider>
        );
        await waitFor(() => expect(authProvider.getCurrentUser).toHaveBeenCalledTimes(2));
        await waitFor(() => expect(context.isReady).toBe(true));
        // Same-account auth refresh must retain a consumed confirmation for retry.
        await act(async () => {
            await context.runRecoverySetup('phrase', confirm);
        });
        expect(context.needsActivation).toBe(false);
        expect(context.recoverySetupRevision).toBe(1);
        expect(confirm).toHaveBeenCalledOnce();
        expect(keyDerivation.activate).toHaveBeenCalledTimes(2);
        const otherProvider = {
            ...authProvider,
            getCurrentUser: vi.fn().mockResolvedValue({ id: 'other-user' }),
        };
        view.rerender(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={otherProvider}
                getCachedPrivateKey={getCachedPrivateKey}
                didFromPrivateKey={didFromPrivateKey}
            >
                <Probe />
            </AuthCoordinatorProvider>
        );
        await waitFor(() =>
            expect(context.state.status === 'ready' && context.state.authUser?.id).toBe(
                'other-user'
            )
        );
        const staleConfirmation = vi.fn().mockResolvedValue(undefined);
        // Models an old modal's token request resolving after the account switch.
        await expect(originalRun('phrase', staleConfirmation)).rejects.toThrow('sign in again');
        expect(() => originalReset('phrase')).toThrow('sign in again');
        expect(staleConfirmation).not.toHaveBeenCalled();
        expect(keyDerivation.activate).toHaveBeenCalledTimes(2);
        view.unmount();
    });

    it('bridges idle → real-provider swap with authenticating instead of a stale idle frame', async () => {
        const keyDerivation = createMockKeyDerivation();

        // didFromPrivateKey is always provided by the app, which routes
        // initialize() through the private-key-first path: it awaits the slow
        // cached-key read BEFORE emitting any state, leaving the stale settled
        // state visible.
        const { rerender } = render(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={null}
                getCachedPrivateKey={slowCachedKey(null)}
                didFromPrivateKey={async () => 'did:key:z123'}
            >
                <StatusProbe />
            </AuthCoordinatorProvider>
        );

        // noOp provider path settles in idle (no cached key, no session)
        await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('idle'));

        // Real provider arrives (login) — getCurrentUser never resolves so we
        // can observe the bridge state before initialize() emits anything.
        const pendingProvider: AuthProvider = {
            getIdToken: vi.fn().mockResolvedValue('token'),
            getCurrentUser: vi.fn().mockReturnValue(new Promise(() => {})),
            getProviderType: vi.fn().mockReturnValue('firebase'),
            signOut: vi.fn(),
        };

        rerender(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={pendingProvider}
                getCachedPrivateKey={slowCachedKey(null)}
                didFromPrivateKey={async () => 'did:key:z123'}
            >
                <StatusProbe />
            </AuthCoordinatorProvider>
        );

        // Synchronously after the swap commit, the state must already be
        // transitional — never the stale 'idle' that renders the login page.
        expect(screen.getByTestId('status').textContent).toBe('authenticating');
    });

    it('does not disturb a ready state when the provider swaps', async () => {
        const keyDerivation = createMockKeyDerivation();

        const { rerender } = render(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={null}
                getCachedPrivateKey={slowCachedKey('cached-private-key')}
                didFromPrivateKey={async () => 'did:key:z123'}
            >
                <StatusProbe />
            </AuthCoordinatorProvider>
        );

        // Private-key-first path reaches ready before any session restore
        await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('ready'));

        const pendingProvider: AuthProvider = {
            getIdToken: vi.fn().mockResolvedValue('token'),
            getCurrentUser: vi.fn().mockReturnValue(new Promise(() => {})),
            getProviderType: vi.fn().mockReturnValue('firebase'),
            signOut: vi.fn(),
        };

        rerender(
            <AuthCoordinatorProvider
                keyDerivation={keyDerivation}
                authProvider={pendingProvider}
                getCachedPrivateKey={slowCachedKey('cached-private-key')}
                didFromPrivateKey={async () => 'did:key:z123'}
            >
                <StatusProbe />
            </AuthCoordinatorProvider>
        );

        // The bridge only applies to the settled-idle case; a ready state must
        // not be knocked back synchronously (the app keeps its wallet while the
        // new coordinator re-derives in the background).
        expect(screen.getByTestId('status').textContent).toBe('ready');
    });
});
