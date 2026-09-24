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

export const createManager = (initial: User | null = createUser()): UserManagerLike => {
    let user = initial;
    const loaded = new Set<(user: User) => void>();
    const unloaded = new Set<() => void>();
    const save = (next: User): User => {
        user = next;
        for (const listener of loaded) listener(next);
        return next;
    };
    return {
        settings: {
            authority: 'https://auth.example.org/realms/learncard',
            client_id: 'app',
            redirect_uri: keycloakConfig.redirectUri,
        },
        getUser: vi.fn(async () => user),
        storeUser: vi.fn(async (next: User | null) => {
            user = next;
        }),
        signinSilent: vi.fn(async () => save(createUser({ id_token: 'renewed' }))),
        signinRedirect: vi.fn(async () => undefined),
        signinCallback: vi.fn(async () => save(createUser())),
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
};
