import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    createKeycloakAdmin,
    KeycloakAdminError,
    type FederatedIdentity,
} from '../scripts/keycloak-admin';
import {
    fetchFirebaseUsers,
    linkFirebaseProviders,
    type FirebaseProvider,
    type FirebaseReader,
} from '../scripts/keycloak-provider-links';

const providers: FirebaseProvider[] = [
    { providerId: 'google.com', uid: 'google-sub', email: 'person@example.com' },
    { providerId: 'apple.com', uid: 'apple-sub' },
];
const makeAdmin = (): {
    links: ReturnType<typeof vi.fn<(id: string) => Promise<FederatedIdentity[]>>>;
    request: ReturnType<typeof vi.fn<(path: string, init?: RequestInit) => Promise<Response>>>;
} => ({
    links: vi.fn<(id: string) => Promise<FederatedIdentity[]>>().mockResolvedValue([]),
    request: vi
        .fn<(path: string, init?: RequestInit) => Promise<Response>>()
        .mockResolvedValue(new Response(null, { status: 204 })),
});

afterEach((): void => vi.unstubAllEnvs());

describe('Firebase provider pre-linking', (): void => {
    it('links Google and Apple with provider subjects and is idempotent on rerun', async (): Promise<void> => {
        const admin = makeAdmin();
        const input = { userId: 'user/id', providers, apply: true, admin, log: vi.fn() };
        expect(await linkFirebaseProviders(input)).toMatchObject({ linked: 2, conflicts: 0 });
        expect(
            admin.request.mock.calls.map(([path, init]) => [path, JSON.parse(String(init?.body))])
        ).toEqual([
            [
                '/users/user%2Fid/federated-identity/google',
                {
                    identityProvider: 'google',
                    userId: 'google-sub',
                    userName: 'person@example.com',
                },
            ],
            [
                '/users/user%2Fid/federated-identity/apple',
                { identityProvider: 'apple', userId: 'apple-sub', userName: 'apple-sub' },
            ],
        ]);
        admin.links.mockResolvedValue([
            { identityProvider: 'google', userId: 'google-sub', userName: 'old-name' },
            { identityProvider: 'apple', userId: 'apple-sub', userName: 'apple-sub' },
        ]);
        expect(await linkFirebaseProviders(input)).toMatchObject({ linked: 0, alreadyLinked: 2 });
        expect(admin.request).toHaveBeenCalledTimes(2);
    });

    it('skips occupied aliases without writes', async (): Promise<void> => {
        const admin = makeAdmin();
        admin.links.mockResolvedValue([
            { identityProvider: 'google', userId: 'other', userName: 'other' },
        ]);
        const result = await linkFirebaseProviders({
            userId: 'user',
            providers: [providers[0]!],
            apply: true,
            admin,
            log: vi.fn(),
        });
        expect(result.conflicts).toBe(1);
        expect(admin.request).not.toHaveBeenCalled();
    });

    it('reports a link belonging to another Keycloak user as a conflict and continues', async (): Promise<void> => {
        const admin = makeAdmin();
        admin.request.mockRejectedValueOnce(new KeycloakAdminError(409));
        const result = await linkFirebaseProviders({
            userId: 'user',
            providers,
            apply: true,
            admin,
            log: vi.fn(),
        });
        expect(result).toMatchObject({ conflicts: 1, linked: 1 });
        expect(admin.request.mock.calls.every(([, init]) => init?.method === 'POST')).toBe(true);
    });

    it('dry-run without a user makes no Keycloak calls and prints both plans', async (): Promise<void> => {
        const admin = makeAdmin();
        const log = vi.fn();
        const result = await linkFirebaseProviders({ providers, apply: false, admin, log });
        expect(result).toMatchObject({ linked: 0, wouldLink: 2 });
        expect(admin.links).not.toHaveBeenCalled();
        expect(admin.request).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledTimes(2);
    });

    it('dry-run of a mapped user only reads existing links', async (): Promise<void> => {
        const admin = makeAdmin();
        expect(
            await linkFirebaseProviders({
                userId: 'user',
                providers,
                apply: false,
                admin,
                log: vi.fn(),
            })
        ).toMatchObject({ wouldLink: 2 });
        expect(admin.links).toHaveBeenCalledWith('user');
        expect(admin.request).not.toHaveBeenCalled();
    });

    it('counts non-social users and refuses ambiguous provider subjects', async (): Promise<void> => {
        const admin = makeAdmin();
        expect(
            await linkFirebaseProviders({
                providers: [{ providerId: 'password', uid: 'firebase' }],
                apply: true,
                admin,
                log: vi.fn(),
            })
        ).toMatchObject({ noSocialProvider: 1 });
        expect(
            await linkFirebaseProviders({
                userId: 'user',
                providers: [providers[0]!, { providerId: 'google.com', uid: 'different' }],
                apply: true,
                admin,
                log: vi.fn(),
            })
        ).toMatchObject({ conflicts: 1 });
        expect(admin.request).not.toHaveBeenCalled();
    });

    it('uses the refresh-once path for a 401 during the linking POST', async (): Promise<void> => {
        vi.stubEnv('KEYCLOAK_ADMIN_CLIENT_SECRET', 'test');
        const fetchRequest = vi
            .fn<typeof fetch>()
            .mockResolvedValueOnce(Response.json({ access_token: 'first', expires_in: 100 }))
            .mockResolvedValueOnce(Response.json([]))
            .mockResolvedValueOnce(new Response(null, { status: 401 }))
            .mockResolvedValueOnce(Response.json({ access_token: 'second', expires_in: 100 }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }));
        const admin = await createKeycloakAdmin(fetchRequest);
        expect(
            await linkFirebaseProviders({
                userId: 'user',
                providers: [providers[0]!],
                apply: true,
                admin,
                log: vi.fn(),
            })
        ).toMatchObject({ linked: 1 });
        expect(fetchRequest).toHaveBeenCalledTimes(5);
        expect(fetchRequest.mock.calls[4]?.[1]).toMatchObject({
            method: 'POST',
            headers: { Authorization: 'Bearer second' },
        });
        expect(fetchRequest.mock.calls[4]?.[1]?.body).toBe(fetchRequest.mock.calls[2]?.[1]?.body);
    });

    it('propagates non-conflict failures', async (): Promise<void> => {
        const admin = makeAdmin();
        admin.request.mockRejectedValueOnce(new KeycloakAdminError(403));
        await expect(
            linkFirebaseProviders({ userId: 'user', providers, apply: true, admin, log: vi.fn() })
        ).rejects.toThrow('403');
    });
});

describe('Firebase discovery', (): void => {
    it('deduplicates UIDs and batches at 100 with a pause', async (): Promise<void> => {
        const getUsers = vi
            .fn<FirebaseReader['getUsers']>()
            .mockImplementation(async identifiers => ({
                users: identifiers.map(({ uid }) => ({
                    uid,
                    disabled: false,
                    providerData: providers,
                })),
            }));
        const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
        const ids = Array.from({ length: 101 }, (_, index) => `uid-${index}`);
        const users = await fetchFirebaseUsers([...ids, ids[0]!], { getUsers }, sleep);
        expect(users.size).toBe(101);
        expect(getUsers.mock.calls.map(([batch]) => batch.length)).toEqual([100, 1]);
        expect(sleep).toHaveBeenCalledExactlyOnceWith(1000);
        expect(users.get('uid-0')?.providerData).toEqual(providers);
    });

    it('backs off on rate limits and stops after three retries', async (): Promise<void> => {
        const error = { code: 'auth/too-many-requests' };
        const getUsers = vi.fn<FirebaseReader['getUsers']>().mockRejectedValue(error);
        const sleep = vi.fn<(ms: number) => Promise<void>>().mockResolvedValue(undefined);
        await expect(fetchFirebaseUsers(['uid'], { getUsers }, sleep)).rejects.toEqual(error);
        expect(getUsers).toHaveBeenCalledTimes(4);
        expect(sleep.mock.calls).toEqual([[1000], [2000], [4000]]);
    });
});
