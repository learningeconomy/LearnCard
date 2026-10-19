// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../config/authConfig', () => ({
    getAuthConfig: () => ({ authProvider: 'firebase', tenantId: 'test' }),
}));

import { useAuthSessionProvider } from '../useAuthSessionProvider';
import { SignInAdapterProvider } from '../SignInAdapterProvider';
import { authUserStore } from '../../stores/authUserStore';
import { registerAuthProviderFactory } from '../../config/providerRegistry';
import {
    createFirebaseAuthProvider,
    type FirebaseAuthConfig,
} from '../../auth-providers/createFirebaseAuthProvider';
import {
    AuthCoordinatorProvider,
    useAuthCoordinator,
    type AuthCoordinatorContextValue,
} from '../../auth-coordinator/AuthCoordinatorProvider';
import type { AuthUser, SignInAdapter, KeyDerivationStrategy } from '../../auth-coordinator/types';

type FirebaseUser = NonNullable<ReturnType<FirebaseAuthConfig['getAuth']>['currentUser']>;
let liveUser: FirebaseUser | null;
let publish: (user: AuthUser | null) => void;
let context: AuthCoordinatorContextValue;
let adapter: SignInAdapter;
let cachedKey: string | null;
let keyDerivation: KeyDerivationStrategy;
const resolveProvider = vi.fn();
const readCachedKey = vi.fn(async () => cachedKey);
const didFromPrivateKey = async () => 'did:key:cached';
const makeUser = (id = 'same-user', displayName = 'Apple Name'): FirebaseUser => ({
    uid: id,
    displayName,
    email: 'scout@example.com',
    phoneNumber: null,
    photoURL: null,
    getIdToken: async () => 'token',
});
const publishLiveUser = (user: FirebaseUser | null): void => {
    liveUser = user;
    publish(user ? { id: user.uid, displayName: user.displayName ?? undefined } : null);
};
const Probe = () => {
    const value = useAuthCoordinator();
    React.useEffect(() => {
        context = value;
    }, [value]);
    return null;
};
const App = () => {
    const authProvider = useAuthSessionProvider();
    return (
        <AuthCoordinatorProvider
            authProvider={authProvider}
            keyDerivation={keyDerivation}
            getCachedPrivateKey={readCachedKey}
            didFromPrivateKey={didFromPrivateKey}
        >
            <Probe />
        </AuthCoordinatorProvider>
    );
};
const mount = () =>
    render(
        <SignInAdapterProvider adapter={adapter}>
            <App />
        </SignInAdapterProvider>
    );

beforeEach(() => {
    vi.clearAllMocks();
    liveUser = null;
    cachedKey = null;
    // Persisted identity is already available before the SDK restores its session.
    authUserStore.set.setUser({ id: 'same-user', displayName: 'Persisted Name' });
    adapter = {
        providerType: 'firebase',
        getCurrentUser: () =>
            liveUser ? { id: liveUser.uid, displayName: liveUser.displayName ?? undefined } : null,
        subscribe: (listener: typeof publish) => {
            publish = listener;
            return () => undefined;
        },
    } as SignInAdapter;
    keyDerivation = {
        name: 'mock',
        capabilities: { recovery: false },
        hasLocalKey: vi.fn().mockResolvedValue(false),
        fetchServerKeyStatus: vi
            .fn()
            .mockResolvedValue({ exists: false, needsMigration: false, recoveryMethods: [] }),
        deriveKey: vi.fn(),
        setupKey: vi.fn(),
        clearLocalKeys: vi.fn(),
    } as unknown as KeyDerivationStrategy;
    resolveProvider.mockImplementation(() =>
        createFirebaseAuthProvider({ getAuth: () => ({ currentUser: liveUser }) })
    );
    registerAuthProviderFactory('firebase', resolveProvider);
});
afterEach(cleanup);

describe('live auth session lifecycle', () => {
    it('initializes after a persisted UID becomes a live session', async () => {
        mount();
        await waitFor(() => expect(context.state.status).toBe('idle'));
        act(() => publishLiveUser(makeUser()));
        await waitFor(() => expect(context.state.status).toBe('needs_setup'));
        expect(context.state).toMatchObject({ authUser: { id: 'same-user' } });
    });

    it('restores identity and session validity for a cached-key account with the same UID', async () => {
        cachedKey = 'cached-key';
        mount();
        await waitFor(() =>
            expect(context.state).toMatchObject({ status: 'ready', authSessionValid: false })
        );
        act(() => publishLiveUser(makeUser()));
        await waitFor(() =>
            expect(context.state).toMatchObject({
                status: 'ready',
                authSessionValid: true,
                authUser: { id: 'same-user' },
            })
        );
    });

    it('does not restart setup when same-account Apple profile enrichment is published', async () => {
        liveUser = makeUser('same-user', '');
        mount();
        await waitFor(() => expect(context.state.status).toBe('needs_setup'));
        const originalState = context.state;
        const initialReads = readCachedKey.mock.calls.length;
        act(() => publishLiveUser(makeUser('same-user', 'Late Apple Name')));
        expect(resolveProvider).toHaveBeenCalledOnce();
        expect(readCachedKey).toHaveBeenCalledTimes(initialReads);
        expect(context.state).toBe(originalState);
    });

    it('reinitializes on logout, same-UID sign-in, and account switch', async () => {
        liveUser = makeUser();
        mount();
        await waitFor(() => expect(context.state.status).toBe('needs_setup'));
        act(() => publishLiveUser(null));
        await waitFor(() => expect(context.state.status).toBe('idle'));
        act(() => publishLiveUser(makeUser()));
        await waitFor(() => expect(context.state.status).toBe('needs_setup'));
        act(() => publishLiveUser(makeUser('other-user')));
        await waitFor(() =>
            expect(context.state).toMatchObject({
                status: 'needs_setup',
                authUser: { id: 'other-user' },
            })
        );
        expect(resolveProvider).toHaveBeenCalledTimes(3);
    });
});
