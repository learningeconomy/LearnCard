import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SignInAdapter } from '@learncard/types';
import { InMemoryWebStorage, User, UserManager, WebStorageStateStore } from 'oidc-client-ts';
import { createKeycloakUserStorage } from '../../../../packages/learn-card-base/src/auth-providers/keycloakUserStorage';

vi.mock('learn-card-base', () => ({ getLogger: () => ({ warn: vi.fn(), info: vi.fn() }) }));
vi.mock('@ionic/react', () => ({ IonIcon: (): React.ReactElement => <span /> }));

const authority = 'https://auth.example.com/realms/test';
const clientId = 'app';
const userKey = `oidc.user:${authority}:${clientId}`;
const modeKey = `learncard.keycloak.persistence:${authority}:${clientId}`;

const createSession = (): {
    adapter: SignInAdapter;
    manager: UserManager;
    signIn: ReturnType<typeof vi.fn>;
} => {
    const storage = createKeycloakUserStorage(authority, clientId, localStorage, sessionStorage);
    const manager = new UserManager({
        authority,
        client_id: clientId,
        redirect_uri: 'https://app.example.com/login',
        userStore: new WebStorageStateStore({ store: storage.store }),
        automaticSilentRenew: false,
    });
    const signIn = vi.fn(async (): Promise<null> => {
        await manager.storeUser(
            new User({
                access_token: 'test-token',
                token_type: 'Bearer',
                profile: { sub: 'user', iss: authority, aud: clientId, exp: 9999999999, iat: 1 },
            })
        );
        return null;
    });
    // Only the SDK entry points exercised here are needed; real OIDC token storage is retained.
    const adapter = {
        providerType: 'keycloak',
        setSessionPersistence: storage.setSessionPersistence,
        signInWithCustomToken: signIn,
        signInWithGoogle: signIn,
        signInWithApple: signIn,
        signInWithOidcCredential: signIn,
    } as unknown as SignInAdapter;
    return { adapter, manager, signIn };
};

beforeEach((): void => {
    vi.resetModules();
    localStorage.clear();
    sessionStorage.clear();
});
afterEach((): void => {
    cleanup();
    vi.restoreAllMocks();
});

describe('Shared Computer sign-in persistence', (): void => {
    it('does not show a blocking error for Firebase persistence failures', async () => {
        const { changeSignInPersistence, useSignInPersistence } =
            await import('./signInPersistence');
        const { adapter } = createSession();
        const firebase = {
            ...adapter,
            providerType: 'firebase',
            setSessionPersistence: vi.fn().mockRejectedValue(new Error('storage denied')),
        };
        await changeSignInPersistence(firebase, true);
        expect(useSignInPersistence.getState().error).toBeNull();
        expect(useSignInPersistence.getState().isUpdating).toBe(false);
    });
    it('keeps tab A session tokens private when tab B chooses persistent sign-in', async () => {
        const { changeSignInPersistence, withSignInPersistence } =
            await import('./signInPersistence');
        const { setPublicComputerMode } = await import('@learncard/sss-key-manager');
        const first = createSession();
        await changeSignInPersistence(first.adapter, true);
        await first.signIn();
        const second = createKeycloakUserStorage(
            authority,
            clientId,
            localStorage,
            new InMemoryWebStorage()
        );
        await second.setSessionPersistence(false);
        second.store.setItem(userKey, 'tab-b-token');
        setPublicComputerMode(false);
        await first.signIn();
        expect(localStorage.getItem(userKey)).toBe('tab-b-token');
        expect(sessionStorage.getItem(userKey)).toContain('test-token');
        await withSignInPersistence(first.adapter).signInWithGoogle();
        expect(sessionStorage.getItem(userKey)).toContain('test-token');
        expect(localStorage.getItem(userKey)).not.toBe(expect.stringContaining('test-token'));
        const reloaded = createSession();
        await reloaded.signIn();
        expect(sessionStorage.getItem(userKey)).toContain('test-token');
        expect(localStorage.getItem(userKey)).not.toBe(expect.stringContaining('test-token'));
    });
    it('stores only session tokens and is signed out after closing and reopening', async (): Promise<void> => {
        const { changeSignInPersistence, withSignInPersistence } =
            await import('./signInPersistence');
        const first = createSession();
        await first.signIn();
        expect(localStorage.getItem(userKey)).not.toBeNull();
        await changeSignInPersistence(first.adapter, true);
        await withSignInPersistence(first.adapter).signInWithCustomToken('email-ticket');
        expect(await first.manager.getUser()).not.toBeNull();
        expect(localStorage.getItem(userKey)).toBeNull();
        expect(sessionStorage.getItem(userKey)).not.toBeNull();
        expect(localStorage.getItem(modeKey)).toBe('session');
        expect(sessionStorage.getItem(modeKey)).toBe('session');
        sessionStorage.clear();
        const reopened = createSession();
        expect(await reopened.manager.getUser()).toBeNull();
        expect(localStorage.getItem(userKey)).toBeNull();
    });

    it('moves tokens back to local storage when remembering the device', async (): Promise<void> => {
        const { changeSignInPersistence, withSignInPersistence } =
            await import('./signInPersistence');
        const { adapter } = createSession();
        await changeSignInPersistence(adapter, true);
        await withSignInPersistence(adapter).signInWithGoogle();
        await changeSignInPersistence(adapter, false);
        expect(localStorage.getItem(userKey)).not.toBeNull();
        expect(sessionStorage.getItem(userKey)).toBeNull();
        expect(localStorage.getItem(modeKey)).toBe('local');
    });

    it.each(['email', 'google', 'apple', 'native'] as const)(
        'awaits persistence before %s sign-in',
        async (entry): Promise<void> => {
            const { withSignInPersistence } = await import('./signInPersistence');
            const { adapter, signIn } = createSession();
            let release: (() => void) | undefined;
            adapter.setSessionPersistence = vi.fn(
                (): Promise<void> =>
                    new Promise(resolve => {
                        release = resolve;
                    })
            );
            const wrapped = withSignInPersistence(adapter);
            const signingIn =
                entry === 'email'
                    ? wrapped.signInWithCustomToken('ticket')
                    : entry === 'google'
                      ? wrapped.signInWithGoogle()
                      : entry === 'apple'
                        ? wrapped.signInWithApple()
                        : wrapped.signInWithOidcCredential('google', 'native-token');
            await vi.waitFor((): void =>
                expect(adapter.setSessionPersistence).toHaveBeenCalledWith(false)
            );
            expect(signIn).not.toHaveBeenCalled();
            release?.();
            await signingIn;
            expect(signIn).toHaveBeenCalledOnce();
        }
    );

    it('waits for an in-flight toggle before starting sign-in', async (): Promise<void> => {
        const { changeSignInPersistence, withSignInPersistence } =
            await import('./signInPersistence');
        const { adapter, signIn } = createSession();
        const original = adapter.setSessionPersistence!;
        let release: (() => void) | undefined;
        adapter.setSessionPersistence = vi
            .fn(original)
            .mockImplementationOnce(async (mode: boolean): Promise<void> => {
                await new Promise<void>(resolve => {
                    release = resolve;
                });
                await original(mode);
            });
        const changing = changeSignInPersistence(adapter, true);
        const signingIn = withSignInPersistence(adapter).signInWithGoogle();
        expect(signIn).not.toHaveBeenCalled();
        release?.();
        await changing;
        await signingIn;
        expect(localStorage.getItem(userKey)).toBeNull();
    });

    it('shows a friendly error, turns the mode off and blocks sign-in after failure', async (): Promise<void> => {
        const { changeSignInPersistence, useSignInPersistence, withSignInPersistence } =
            await import('./signInPersistence');
        const { SignInPersistenceError } = await import('../pages/login/SignInPersistenceError');
        const { adapter, signIn } = createSession();
        adapter.setSessionPersistence = vi.fn().mockRejectedValue(new Error('storage denied'));
        render(<SignInPersistenceError />);
        await act(async (): Promise<void> => {
            await changeSignInPersistence(adapter, true);
        });
        expect(screen.getByRole('alert').textContent).toContain('Sign-in was stopped');
        expect(screen.getByRole('alert').textContent).not.toContain('storage denied');
        expect(useSignInPersistence.getState().isPublicMode).toBe(false);
        expect(useSignInPersistence.getState().isUpdating).toBe(false);
        await expect(withSignInPersistence(adapter).signInWithGoogle()).rejects.toThrow(
            'Sign-in was stopped'
        );
        expect(signIn).not.toHaveBeenCalled();
    });
});
