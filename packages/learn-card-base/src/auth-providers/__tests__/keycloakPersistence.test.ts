import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InMemoryWebStorage, UserManager } from 'oidc-client-ts';
import { createKeycloakAuthProvider } from '../createKeycloakAuthProvider';
import { createUser, keycloakConfig } from './keycloakTestHelpers';

const authority = 'https://auth.example.org/realms/learncard';
const userKey = `oidc.user:${authority}:app`;
const modeKey = `learncard.keycloak.persistence:${authority}:app`;

const createStorage = (): Storage => {
    const values = new Map<string, string>();
    return {
        get length(): number {
            return values.size;
        },
        key: (index: number): string | null => [...values.keys()][index] ?? null,
        getItem: (key: string): string | null => values.get(key) ?? null,
        setItem: (key: string, value: string): void => {
            values.set(key, value);
        },
        removeItem: (key: string): void => {
            values.delete(key);
        },
        clear: (): void => values.clear(),
    };
};

describe('Keycloak browser persistence', (): void => {
    let local: Storage;
    let session: Storage;
    const managers: UserManager[] = [];
    const create = (): ReturnType<typeof createKeycloakAuthProvider> => {
        const provider = createKeycloakAuthProvider(keycloakConfig);
        if (provider.userManager instanceof UserManager) managers.push(provider.userManager);
        return provider;
    };

    beforeEach((): void => {
        local = createStorage();
        session = createStorage();
        vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
    });
    afterEach((): void => {
        for (const manager of managers) manager.stopSilentRenew();
        managers.length = 0;
        vi.unstubAllGlobals();
    });

    it('moves the entire token record in both directions and routes future writes', async (): Promise<void> => {
        const provider = create();
        const user = createUser();
        await provider.userManager.storeUser(user);
        const record = local.getItem(userKey);
        expect(record).toBe(user.toStorageString());
        await provider.setSessionPersistence(true);
        expect(local.getItem(userKey)).toBeNull();
        expect(session.getItem(userKey)).toBe(record);
        expect(local.getItem(modeKey)).toBe('session');
        const renewed = createUser({ refresh_token: 'renewed-refresh' });
        await provider.userManager.storeUser(renewed);
        expect(session.getItem(userKey)).toBe(renewed.toStorageString());
        expect(local.getItem(userKey)).toBeNull();
        await provider.setSessionPersistence(false);
        expect(session.getItem(userKey)).toBeNull();
        expect(local.getItem(userKey)).toBe(renewed.toStorageString());
        expect(local.getItem(modeKey)).toBe('local');
    });

    it('keeps session mode across reloads but loses the user after the tab closes', async (): Promise<void> => {
        const provider = create();
        await provider.userManager.storeUser(createUser());
        await provider.setSessionPersistence(true);
        expect(await create().getCurrentUser()).toMatchObject({ id: 'user-1' });
        session.clear();
        // Even a stray record must not resurrect the user after browser closure.
        local.setItem(userKey, createUser().toStorageString());
        expect(await create().getCurrentUser()).toBeNull();
        expect(local.getItem(userKey)).toBeNull();
        expect(local.getItem(modeKey)).toBe('session');
    });

    it('retains local mode across reconstruction and removes stray session records', async (): Promise<void> => {
        const provider = create();
        await provider.setSessionPersistence(true);
        await provider.userManager.storeUser(createUser());
        await provider.setSessionPersistence(false);
        session.setItem(userKey, 'stale-session');
        expect(await create().getCurrentUser()).toMatchObject({ id: 'user-1' });
        expect(session.getItem(userKey)).toBeNull();
        expect(local.getItem(userKey)).not.toBeNull();
    });

    it('does not let an older provider write tokens back to local storage', async (): Promise<void> => {
        const older = create();
        await create().setSessionPersistence(true);
        await older.userManager.storeUser(createUser());
        expect(local.getItem(userKey)).toBeNull();
        expect(session.getItem(userKey)).not.toBeNull();
    });

    it('preserves pending PKCE state and unrelated clients while switching modes', async (): Promise<void> => {
        const provider = create();
        local.setItem('oidc.pending-state', 'pkce-verifier');
        local.setItem(`oidc.user:${authority}:other-client`, 'other-user');
        await provider.setSessionPersistence(true);
        create();
        expect(local.getItem('oidc.pending-state')).toBe('pkce-verifier');
        expect(local.getItem(`oidc.user:${authority}:other-client`)).toBe('other-user');
    });

    it('invalidates a shared tab without promoting its renewed tokens when another tab remembers the device', async (): Promise<void> => {
        const sharedTab = create();
        await sharedTab.setSessionPersistence(true);
        await sharedTab.userManager.storeUser(createUser());

        const otherSession = createStorage();
        vi.stubGlobal('window', { localStorage: local, sessionStorage: otherSession });
        const persistentTab = create();
        await persistentTab.setSessionPersistence(false);
        const persistentUser = createUser({ refresh_token: 'other-tab-refresh' });
        await persistentTab.userManager.storeUser(persistentUser);

        expect(await sharedTab.getCurrentUser()).toBeNull();
        expect(session.getItem(userKey)).toBeNull();
        const renewed = createUser({ refresh_token: 'shared-tab-refresh' });
        await sharedTab.userManager.storeUser(renewed);
        expect(session.getItem(userKey)).toBe(renewed.toStorageString());
        expect(local.getItem(userKey)).toBe(persistentUser.toStorageString());

        vi.stubGlobal('window', { localStorage: local, sessionStorage: session });
        const reloaded = create();
        await reloaded.userManager.storeUser(renewed);
        expect(session.getItem(userKey)).toBe(renewed.toStorageString());
        expect(local.getItem(userKey)).toBe(persistentUser.toStorageString());
    });

    it('prevents an older provider in another tab from writing local tokens after Shared Computer is enabled', async (): Promise<void> => {
        const older = create();
        const otherSession = createStorage();
        vi.stubGlobal('window', { localStorage: local, sessionStorage: otherSession });
        await create().setSessionPersistence(true);
        await older.userManager.storeUser(createUser());
        expect(local.getItem(userKey)).toBeNull();
        expect(session.getItem(userKey)).not.toBeNull();
    });

    it('invalidates other tabs session records on sign-out without changing modes', async (): Promise<void> => {
        const firstTab = create();
        await firstTab.setSessionPersistence(true);
        // No refresh token: sign-out needs no remote revocation in this storage test.
        const user = createUser({ refresh_token: undefined });
        await firstTab.userManager.storeUser(user);
        const otherSession = createStorage();
        vi.stubGlobal('window', { localStorage: local, sessionStorage: otherSession });
        const otherTab = create();
        await otherTab.userManager.storeUser(user);
        await firstTab.signOut();
        expect(await otherTab.getCurrentUser()).toBeNull();
        expect(otherSession.getItem(userKey)).toBeNull();
        expect(session.getItem(userKey)).toBeNull();
        expect(local.getItem(userKey)).toBeNull();
    });

    it('invalidates other tabs session records across mode changes and sign-out', async (): Promise<void> => {
        const firstTab = create();
        await firstTab.setSessionPersistence(true);
        await firstTab.userManager.storeUser(createUser());
        const otherSession = createStorage();
        vi.stubGlobal('window', { localStorage: local, sessionStorage: otherSession });
        const otherTab = create();
        await otherTab.userManager.storeUser(createUser());
        await firstTab.setSessionPersistence(false);
        await firstTab.signOut();
        await firstTab.setSessionPersistence(true);
        expect(await otherTab.getCurrentUser()).toBeNull();
        expect(otherSession.getItem(userKey)).toBeNull();
        expect(local.getItem(userKey)).toBeNull();
    });

    it('does not revive stale target users when switching without a source user', async (): Promise<void> => {
        const provider = create();
        session.setItem(userKey, createUser().toStorageString());
        await provider.setSessionPersistence(true);
        expect(await provider.getCurrentUser()).toBeNull();
        await provider.setSessionPersistence(true);
        expect(session.getItem(userKey)).toBeNull();
    });

    it('constructs without window and isolates in-memory users between providers', async (): Promise<void> => {
        vi.stubGlobal('window', undefined);
        const provider = create();
        await provider.userManager.storeUser(createUser());
        expect(await provider.getCurrentUser()).toMatchObject({ id: 'user-1' });
        expect(await create().getCurrentUser()).toBeNull();
    });

    it('allows hosts with custom stores to provide persistence migration', async (): Promise<void> => {
        const setSessionPersistence = vi.fn(async (): Promise<void> => undefined);
        const provider = createKeycloakAuthProvider({
            ...keycloakConfig,
            userStore: new InMemoryWebStorage(),
            setSessionPersistence,
        });
        await provider.setSessionPersistence(true);
        expect(setSessionPersistence).toHaveBeenCalledWith(true);
    });
});
