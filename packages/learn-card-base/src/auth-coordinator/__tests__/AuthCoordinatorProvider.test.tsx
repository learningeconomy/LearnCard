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
import { render, screen, waitFor } from '@testing-library/react';

import { AuthCoordinatorProvider, useAuthCoordinator } from '../AuthCoordinatorProvider';

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
    } as unknown as KeyDerivationStrategy);

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
