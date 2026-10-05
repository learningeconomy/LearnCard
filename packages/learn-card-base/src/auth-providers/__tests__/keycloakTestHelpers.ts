import { vi } from 'vitest';
import { User } from 'oidc-client-ts';
import type { UserManagerLike } from '../createKeycloakAuthProvider';

export const keycloakConfig = {
    serverUrl: 'https://auth.example.org/',
    realm: 'learncard',
    clientId: 'app',
    redirectUri: 'https://app.example.org/callback',
};

export const createUser = (overrides: Partial<ConstructorParameters<typeof User>[0]> = {}): User =>
    new User({
        access_token: 'access',
        id_token: 'id',
        refresh_token: 'refresh',
        token_type: 'Bearer',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        profile: {
            sub: 'user-1',
            iss: 'https://auth.example.org/realms/learncard',
            aud: 'app',
            exp: 9999999999,
            iat: 1,
            email: 'person@example.org',
            phone_number: '+15555550123',
            name: 'Person',
            picture: 'https://example.org/photo',
        },
        ...overrides,
    });

export const createManager = (initial: User | null = createUser()) => {
    let user = initial;
    const loaded = new Set<(user: User) => void>();
    const unloaded = new Set<() => void>();
    const save = async (next: User): Promise<User> => {
        // Match oidc-client-ts: storage must succeed before UserLoaded is emitted.
        await manager.storeUser(next);
        for (const listener of loaded) listener(next);
        return next;
    };
    const methods = {
        signinSilent: vi.fn(async (): Promise<User | null> =>
            save(createUser({ id_token: 'renewed' }))
        ),
        signinCallback: vi.fn(async (_url?: string): Promise<User | undefined> =>
            save(createUser())
        ),
    };
    const manager = {
        mocks: methods,
        settings: {
            authority: 'https://auth.example.org/realms/learncard',
            client_id: 'app',
            redirect_uri: keycloakConfig.redirectUri,
        },
        getUser: vi.fn(async () => user),
        storeUser: vi.fn(async (next: User | null) => {
            user = next;
        }),
        signinSilent: methods.signinSilent as UserManagerLike['signinSilent'],
        signinRedirect: vi.fn(async () => undefined),
        signinCallback: methods.signinCallback as UserManagerLike['signinCallback'],
        signoutRedirect: vi.fn(async () => undefined),
        removeUser: vi.fn(async () => {
            user = null;
            for (const listener of unloaded) listener();
        }),
        events: {
            addUserLoaded: vi.fn((callback: (user: User) => void) => loaded.add(callback)),
            removeUserLoaded: vi.fn((callback: (user: User) => void) => {
                loaded.delete(callback);
            }),
            addUserUnloaded: vi.fn((callback: () => void) => unloaded.add(callback)),
            removeUserUnloaded: vi.fn((callback: () => void) => {
                unloaded.delete(callback);
            }),
            addAccessTokenExpiring: vi.fn(),
        },
    };
    return manager;
};
